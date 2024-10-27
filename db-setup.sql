-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION http with schema extensions;

/* ===========================
   Domains Table and Related Indexes
=========================== */

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

-- Enable Row Level Security (RLS) on domains table
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- RLS policy for domains table
CREATE POLICY domains_policy ON domains
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for registrar_id in domains table
CREATE INDEX idx_domains_registrar_id ON domains(registrar_id);

-- Index for user_id in domains table
CREATE INDEX idx_domains_user_id ON domains(user_id);


/* ===========================
   Tags and Domain Tags Tables
=========================== */

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT,
  description TEXT,
  icon TEXT,
  UNIQUE(name)
);

-- Enable RLS on tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Policies for tags table (select for all, modify for authenticated users)
CREATE POLICY tags_select_policy ON tags FOR SELECT USING (true);
CREATE POLICY tags_modify_policy ON tags USING (auth.role() = 'authenticated');

-- Domain Tags (junction table for many-to-many relationship between domains and tags)
CREATE TABLE domain_tags (
  domain_id UUID REFERENCES domains(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (domain_id, tag_id)
);

-- Enable RLS on domain_tags table
ALTER TABLE domain_tags ENABLE ROW LEVEL SECURITY;

-- Policy for domain_tags table
CREATE POLICY domain_tags_policy ON domain_tags
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_tags.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_tags.domain_id AND domains.user_id = auth.uid()));


/* ===========================
   Registrars and Hosts Tables
=========================== */

-- Registrars table
CREATE TABLE registrars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT,
  UNIQUE(name)
);

-- Enable RLS on registrars table
ALTER TABLE registrars ENABLE ROW LEVEL SECURITY;

-- Policies for registrars table (select for all, modify for authenticated users)
CREATE POLICY registrars_select_policy ON registrars FOR SELECT USING (true);
CREATE POLICY registrars_modify_policy ON registrars USING (auth.role() = 'authenticated');

-- Hosts table
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

-- Policies for hosts table (select for all, modify for authenticated users)
CREATE POLICY hosts_select_policy ON hosts FOR SELECT USING (true);
CREATE POLICY hosts_modify_policy ON hosts USING (auth.role() = 'authenticated');

-- Domain Hosts (junction table for many-to-many relationship between domains and hosts)
CREATE TABLE domain_hosts (
  domain_id UUID REFERENCES domains(id),
  host_id UUID REFERENCES hosts(id),
  PRIMARY KEY (domain_id, host_id)
);

-- Enable RLS on domain_hosts table
ALTER TABLE domain_hosts ENABLE ROW LEVEL SECURITY;

-- Policy for domain_hosts table
CREATE POLICY domain_hosts_policy ON domain_hosts
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_hosts.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_hosts.domain_id AND domains.user_id = auth.uid()));

-- Indexes for performance on domain_hosts table
CREATE INDEX idx_domain_hosts_domain_id ON domain_hosts(domain_id);
CREATE INDEX idx_domain_hosts_host_id ON domain_hosts(host_id);


/* ===========================
   WHOIS Information Table
=========================== */

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

-- Policy for whois_info table
CREATE POLICY whois_info_policy ON whois_info
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = whois_info.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = whois_info.domain_id AND domains.user_id = auth.uid()));


/* ===========================
   DNS Records Table
=========================== */

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

-- Policy for dns_records table
CREATE POLICY dns_records_policy ON dns_records
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = dns_records.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = dns_records.domain_id AND domains.user_id = auth.uid()));

-- Index for dns_records
CREATE INDEX idx_dns_records_domain_id ON dns_records(domain_id);


/* ===========================
   SSL Certificates Table
=========================== */

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

-- Policy for ssl_certificates table
CREATE POLICY ssl_certificates_policy ON ssl_certificates
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = ssl_certificates.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = ssl_certificates.domain_id AND domains.user_id = auth.uid()));

-- Index for ssl_certificates
CREATE INDEX idx_ssl_certificates_domain_id ON ssl_certificates(domain_id);


/* ===========================
   IP Addresses Table
=========================== */

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

-- Policy for ip_addresses table
CREATE POLICY ip_addresses_policy ON ip_addresses
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = ip_addresses.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = ip_addresses.domain_id AND domains.user_id = auth.uid()));

-- Index for ip_addresses
CREATE INDEX idx_ip_addresses_domain_id ON ip_addresses(domain_id);


/* ===========================
   Notification Preferences Table
=========================== */

-- Notifications table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  notification_type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(domain_id, notification_type)
);

-- Enable RLS on notifications table
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for notifications table
CREATE POLICY notifications_policy ON notification_preferences
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = notification_preferences.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = notification_preferences.domain_id AND domains.user_id = auth.uid()));

-- Index for notifications
CREATE INDEX idx_notifications_domain_id ON notification_preferences(domain_id);


CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  domain_id UUID NOT NULL REFERENCES domains(id),
  change_type TEXT NOT NULL,
  message TEXT,
  sent BOOLEAN NOT NULL DEFAULT false,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policy to allow access for the correct user
CREATE POLICY select_notifications_policy ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY insert_notifications_policy ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);


/* ===========================
Notifications Table
=========================== */

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  domain_id UUID NOT NULL REFERENCES domains(id),
  change_type TEXT NOT NULL,
  message TEXT,
  sent BOOLEAN NOT NULL DEFAULT false,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policy to allow users to access only their notifications
CREATE POLICY select_notifications_policy ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY insert_notifications_policy ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for user_id and domain_id for efficient queries
CREATE INDEX idx_notifications_user_id_domain_id ON notifications(user_id, domain_id);




/* ===========================
   Domain Statuses Table
=========================== */

-- Domain Statuses table to store EPP statuses
CREATE TABLE domain_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  status_code TEXT NOT NULL,  -- EPP status code (e.g., addPeriod, ok, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on domain_statuses table
ALTER TABLE domain_statuses ENABLE ROW LEVEL SECURITY;

-- Policy for domain_statuses table
CREATE POLICY domain_statuses_policy ON domain_statuses
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_statuses.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_statuses.domain_id AND domains.user_id = auth.uid()));


/* ===========================
   Domain Costings Table
=========================== */

-- Domain Costings table to track domain costs
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

-- RLS policy for domain_costings table
CREATE POLICY domain_costings_policy ON domain_costings
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_costings.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_costings.domain_id AND domains.user_id = auth.uid()));

-- Unique constraint for domain_id in domain_costings table
ALTER TABLE domain_costings
  ADD CONSTRAINT domain_costings_domain_id_unique UNIQUE (domain_id);


/* ===========================
   Domain Updates Table
=========================== */

-- Domain Updates table to track changes
CREATE TABLE domain_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id), -- Reference the user ID
  change TEXT NOT NULL, -- Field that was changed
  change_type TEXT NOT NULL, -- Type of change (added, removed, updated)
  old_value TEXT, -- The old value of the field
  new_value TEXT, -- The new value of the field
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Time of update
);

-- Enable RLS on domain_updates table
ALTER TABLE domain_updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for domain_updates table
CREATE POLICY select_domain_updates ON domain_updates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_domain_updates ON domain_updates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for user_id in domain_updates table
CREATE INDEX idx_domain_updates_user_id ON domain_updates(user_id);


/* ===========================
   Functions
=========================== */

-- Function to get hosts with domain counts
CREATE OR REPLACE FUNCTION get_hosts_with_domain_counts()
RETURNS TABLE (
  host_id UUID,
  ip INET,
  lat NUMERIC,
  lon NUMERIC,
  isp TEXT,
  org TEXT,
  as_number TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  domain_count BIGINT
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

-- Function to get SSL issuers with domain counts
CREATE OR REPLACE FUNCTION get_ssl_issuers_with_domain_counts()
RETURNS TABLE (
  issuer TEXT,
  domain_count BIGINT
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

-- Function to get IP addresses with associated domains
CREATE OR REPLACE FUNCTION get_ip_addresses_with_domains(p_is_ipv6 BOOLEAN)
RETURNS TABLE (
  ip_address INET,
  domains TEXT[]
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

-- Function to delete a domain and its related records
CREATE OR REPLACE FUNCTION delete_domain(domain_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Delete related records
  DELETE FROM ip_addresses WHERE ip_addresses.domain_id = $1;
  DELETE FROM domain_tags WHERE domain_tags.domain_id = $1;
  DELETE FROM notification_preferences WHERE notification_preferences.domain_id = $1;
  DELETE FROM dns_records WHERE dns_records.domain_id = $1;
  DELETE FROM ssl_certificates WHERE ssl_certificates.domain_id = $1;
  DELETE FROM whois_info WHERE whois_info.domain_id = $1;
  DELETE FROM domain_hosts WHERE domain_hosts.domain_id = $1;
  DELETE FROM domain_costings WHERE domain_costings.domain_id = $1; -- Delete costings

  -- Delete the domain itself
  DELETE FROM domains WHERE domains.id = $1;
  
  -- Clean up orphaned records
  DELETE FROM tags WHERE tags.id NOT IN (SELECT DISTINCT tag_id FROM domain_tags);
  DELETE FROM hosts WHERE hosts.id NOT IN (SELECT DISTINCT host_id FROM domain_hosts);
  DELETE FROM registrars WHERE registrars.id NOT IN (SELECT DISTINCT registrar_id FROM domains);
END;
$$;

-- Function to get EPP statuses with domain counts
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

-- Function to get domains by EPP status codes
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

-- Function to update domain costings
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

CREATE OR REPLACE FUNCTION get_tags_with_domain_counts()
RETURNS TABLE (
  tag_id UUID,
  name TEXT,
  color TEXT,
  icon TEXT,
  description TEXT,
  domain_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tags.id AS tag_id,
    tags.name,
    tags.color,
    tags.icon,
    tags.description,
    COUNT(domain_tags.domain_id) AS domain_count
  FROM 
    tags
  LEFT JOIN 
    domain_tags ON tags.id = domain_tags.tag_id
  GROUP BY 
    tags.id;
END;
$$ LANGUAGE plpgsql;


SELECT cron.schedule(
  'run_domain_update_job',
  '0 4 * * *',
  $$SELECT http_post('https://svrtyblfdhowviyowxwt.supabase.co/functions/v1/trigger-updates', '{}');$$
);
