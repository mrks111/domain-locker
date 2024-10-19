-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Domains table
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  domain_name TEXT NOT NULL,
  expiry_date DATE,
  registration_date DATE,
  updated_date DATE,
  notes TEXT,
  registrar_id UUID REFERENCES registrars(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, domain_name)
);

-- Enable RLS on domains table
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Create policy for domains
CREATE POLICY domains_policy ON domains
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  UNIQUE(name)
);

-- Enable RLS on tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create policy for tags (allow read for all, insert/update/delete for authenticated users)
CREATE POLICY tags_select_policy ON tags FOR SELECT USING (true);
CREATE POLICY tags_modify_policy ON tags USING (auth.role() = 'authenticated');

-- Domain Tags junction table
CREATE TABLE domain_tags (
  domain_id UUID REFERENCES domains(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (domain_id, tag_id)
);

-- Enable RLS on domain_tags table
ALTER TABLE domain_tags ENABLE ROW LEVEL SECURITY;

-- Create policy for domain_tags
CREATE POLICY domain_tags_policy ON domain_tags
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_tags.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_tags.domain_id AND domains.user_id = auth.uid()));

-- Create Registrar table
CREATE TABLE registrars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT,
  UNIQUE(name)
);

-- Enable RLS on registrars table
ALTER TABLE registrars ENABLE ROW LEVEL SECURITY;

-- Create policy for registrars (allow read for all, insert/update/delete for authenticated users)
CREATE POLICY registrars_select_policy ON registrars FOR SELECT USING (true);
CREATE POLICY registrars_modify_policy ON registrars USING (auth.role() = 'authenticated');

-- Create Hosts table
CREATE TABLE hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip INET NOT NULL,
  lat NUMERIC,
  lon NUMERIC,
  isp TEXT,
  org TEXT,
  as_number TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  UNIQUE(ip)
);

-- Enable RLS on hosts table
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;

-- Create policy for hosts (allow read for all, insert/update/delete for authenticated users)
CREATE POLICY hosts_select_policy ON hosts FOR SELECT USING (true);
CREATE POLICY hosts_modify_policy ON hosts USING (auth.role() = 'authenticated');

-- Create Domain-Host junction table
CREATE TABLE domain_hosts (
  domain_id UUID REFERENCES domains(id),
  host_id UUID REFERENCES hosts(id),
  PRIMARY KEY (domain_id, host_id)
);

-- Enable RLS on domain_hosts table
ALTER TABLE domain_hosts ENABLE ROW LEVEL SECURITY;

-- Create policy for domain_hosts
CREATE POLICY domain_hosts_policy ON domain_hosts
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_hosts.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_hosts.domain_id AND domains.user_id = auth.uid()));

-- Add index for performance
CREATE INDEX idx_domains_registrar_id ON domains(registrar_id);
CREATE INDEX idx_domain_hosts_domain_id ON domain_hosts(domain_id);
CREATE INDEX idx_domain_hosts_host_id ON domain_hosts(host_id);

-- WHOIS Information table
CREATE TABLE whois_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  name TEXT,
  organization TEXT,
  country TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  UNIQUE(domain_id)
);

-- Enable RLS on whois_info table
ALTER TABLE whois_info ENABLE ROW LEVEL SECURITY;

-- Create policy for whois_info
CREATE POLICY whois_info_policy ON whois_info
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = whois_info.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = whois_info.domain_id AND domains.user_id = auth.uid()));

-- DNS Records table
CREATE TABLE dns_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  record_type TEXT NOT NULL,
  record_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on dns_records table
ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;

-- Create policy for dns_records
CREATE POLICY dns_records_policy ON dns_records
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = dns_records.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = dns_records.domain_id AND domains.user_id = auth.uid()));

-- SSL Certificates table
CREATE TABLE ssl_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  issuer TEXT,
  issuer_country TEXT,
  subject TEXT,
  valid_from DATE,
  valid_to DATE,
  fingerprint TEXT,
  key_size INTEGER,
  signature_algorithm TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on ssl_certificates table
ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;

-- Create policy for ssl_certificates
CREATE POLICY ssl_certificates_policy ON ssl_certificates
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = ssl_certificates.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = ssl_certificates.domain_id AND domains.user_id = auth.uid()));

-- IP Addresses table
CREATE TABLE ip_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  ip_address INET NOT NULL,
  is_ipv6 BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on ip_addresses table
ALTER TABLE ip_addresses ENABLE ROW LEVEL SECURITY;

-- Create policy for ip_addresses
CREATE POLICY ip_addresses_policy ON ip_addresses
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = ip_addresses.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = ip_addresses.domain_id AND domains.user_id = auth.uid()));

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  notification_type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(domain_id, notification_type)
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications
CREATE POLICY notifications_policy ON notifications
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = notifications.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = notifications.domain_id AND domains.user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_dns_records_domain_id ON dns_records(domain_id);
CREATE INDEX idx_ssl_certificates_domain_id ON ssl_certificates(domain_id);
CREATE INDEX idx_ip_addresses_domain_id ON ip_addresses(domain_id);
CREATE INDEX idx_notifications_domain_id ON notifications(domain_id);

-- Create domain_statuses table to store EPP statuses for each domain
CREATE TABLE domain_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  status_code TEXT NOT NULL,  -- EPP status code (e.g., addPeriod, ok, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on domain_statuses table
ALTER TABLE domain_statuses ENABLE ROW LEVEL SECURITY;

-- Create policy for domain_statuses
CREATE POLICY domain_statuses_policy ON domain_statuses
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_statuses.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_statuses.domain_id AND domains.user_id = auth.uid()));



-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create domain_costings table
CREATE TABLE domain_costings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  purchase_price NUMERIC(10, 2) DEFAULT 0,
  current_value NUMERIC(10, 2) DEFAULT 0,
  renewal_cost NUMERIC(10, 2) DEFAULT 0,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on domain_costings table
ALTER TABLE domain_costings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for domain_costings
CREATE POLICY domain_costings_policy ON domain_costings
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_costings.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_costings.domain_id AND domains.user_id = auth.uid()));


ALTER TABLE domain_costings
ADD CONSTRAINT domain_costings_domain_id_unique UNIQUE (domain_id);


-- Function to get hosts with domain counts
CREATE OR REPLACE FUNCTION get_hosts_with_domain_counts()
RETURNS TABLE (
  host_id uuid,
  ip inet,
  lat numeric,
  lon numeric,
  isp text,
  org text,
  as_number text,
  city text,
  region text,
  country text,
  domain_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH user_domains AS (
    SELECT d.id AS domain_id FROM domains d WHERE d.user_id = auth.uid()
  )
  SELECT 
    h.id AS host_id,
    h.ip,
    h.lat,
    h.lon,
    h.isp,
    h.org,
    h.as_number,
    h.city,
    h.region,
    h.country,
    COUNT(DISTINCT ud.domain_id) AS domain_count
  FROM
    hosts h
    LEFT JOIN domain_hosts dh ON h.id = dh.host_id
    LEFT JOIN user_domains ud ON dh.domain_id = ud.domain_id
  GROUP BY
    h.id, h.ip, h.lat, h.lon, h.isp, h.org, h.as_number, h.city, h.region, h.country;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--- Get SSL issuers with domain counts
CREATE OR REPLACE FUNCTION get_ssl_issuers_with_domain_counts()
RETURNS TABLE (
  issuer text,
  domain_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.issuer,
    COUNT(DISTINCT d.id) AS domain_count
  FROM 
    ssl_certificates sc
    JOIN domains d ON sc.domain_id = d.id
  WHERE
    d.user_id = auth.uid()
  GROUP BY 
    sc.issuer
  ORDER BY 
    domain_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_ssl_issuers_with_domain_counts() TO authenticated;

--- Get IP addresses with domains
CREATE OR REPLACE FUNCTION get_ip_addresses_with_domains(p_is_ipv6 boolean)
RETURNS TABLE (
  ip_address inet,
  domains text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ip.ip_address::inet,
    array_agg(DISTINCT d.domain_name) AS domains
  FROM 
    ip_addresses ip
    JOIN domains d ON ip.domain_id = d.id
  WHERE
    d.user_id = auth.uid()
    AND ip.is_ipv6 = p_is_ipv6
  GROUP BY 
    ip.ip_address
  ORDER BY 
    ip.ip_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_ip_addresses_with_domains(boolean) TO authenticated;

--- Delete domain function
CREATE OR REPLACE FUNCTION delete_domain(domain_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete related records
  DELETE FROM ip_addresses WHERE ip_addresses.domain_id = $1;
  DELETE FROM domain_tags WHERE domain_tags.domain_id = $1;
  DELETE FROM notifications WHERE notifications.domain_id = $1;
  DELETE FROM dns_records WHERE dns_records.domain_id = $1;
  DELETE FROM ssl_certificates WHERE ssl_certificates.domain_id = $1;
  DELETE FROM whois_info WHERE whois_info.domain_id = $1;
  DELETE FROM domain_hosts WHERE domain_hosts.domain_id = $1;
  DELETE FROM domain_costings WHERE domain_costings.domain_id = $1; -- New line to delete costings

  -- Delete the domain itself
  DELETE FROM domains WHERE domains.id = $1;
  
  -- Clean up orphaned records
  DELETE FROM tags WHERE tags.id NOT IN (SELECT DISTINCT tag_id FROM domain_tags);
  DELETE FROM hosts WHERE hosts.id NOT IN (SELECT DISTINCT host_id FROM domain_hosts);
  DELETE FROM registrars WHERE registrars.id NOT IN (SELECT DISTINCT registrar_id FROM domains);
END;
$$;

CREATE OR REPLACE FUNCTION get_statuses_with_domain_counts()
RETURNS TABLE (
  status_code TEXT,
  domain_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    domain_statuses.status_code,
    COUNT(domain_statuses.domain_id) AS domain_count
  FROM 
    domain_statuses
  GROUP BY 
    domain_statuses.status_code
  ORDER BY 
    domain_count DESC;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_domains_by_epp_status_codes(status_codes TEXT[])
RETURNS TABLE (
  status_code TEXT,
  domain_id UUID,
  domain_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    domain_statuses.status_code,
    domain_statuses.domain_id,
    domains.domain_name
  FROM 
    domain_statuses
  JOIN 
    domains ON domain_statuses.domain_id = domains.id
  WHERE 
    domain_statuses.status_code = ANY(status_codes)
  ORDER BY 
    domain_statuses.status_code;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION update_domain_costings(
  domain_id UUID, 
  purchase_price NUMERIC, 
  current_value NUMERIC, 
  renewal_cost NUMERIC, 
  auto_renew BOOLEAN
) RETURNS VOID AS $$
BEGIN
  UPDATE domain_costings 
  SET 
    purchase_price = purchase_price, 
    current_value = current_value, 
    renewal_cost = renewal_cost, 
    auto_renew = auto_renew, 
    updated_at = NOW()
  WHERE domain_id = domain_id;
END;
$$ LANGUAGE plpgsql;
