// src/app/services/global-message.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class GlobalMessageService {
  private messageSubject = new BehaviorSubject<Message | null>(null);

  public getMessage(): Observable<Message | null> {
    return this.messageSubject.asObservable();
  }

  public showMessage(message: Message): void {
    this.messageSubject.next(message);
  }

  public clearMessage(): void {
    this.messageSubject.next(null);
  }
}
