import { Injectable, OnDestroy, signal, inject, effect } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth/auth.service';

@Injectable({ providedIn: 'root' })
export class WsService implements OnDestroy {
  private socket: Socket | null = null;
  connected = signal(false);
  private handlers = new Map<string, Set<(data: any) => void>>();
  private currentIdentity: string | null = null;
  private auth = inject(AuthService);

  constructor() {
    // React to auth changes: an SPA login must attach the fresh admin
    // identity; a logout must drop the old room membership.
    effect(() => {
      const identity = this.auth.currentUser()?.id ?? '';
      if (typeof window === 'undefined') return;
      if (identity !== this.currentIdentity) {
        this.reconnectAs(identity);
      }
    });
  }

  private reconnectAs(identity: string): void {
    this.disconnect();
    this.currentIdentity = identity;
    if (identity) {
      this.connect();
    }
  }

  private connect() {
    const token = this.auth.getToken();
    if (!token || !this.auth.isLoggedIn() || this.socket) return;
    if (typeof window === 'undefined') return;

    this.socket = io(environment.wsUrl || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.connected.set(true);
      this.socket?.emit('join:room', 'admin');
    });

    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on('connect_error', (err) => console.error('[WsService] connect error:', err?.message));

    this.socket.onAny((event: string, data: any) => {
      this.handlers.get(event)?.forEach((h) => h(data));
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
  }

  on<T = any>(event: string, handler: (data: T) => void) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
