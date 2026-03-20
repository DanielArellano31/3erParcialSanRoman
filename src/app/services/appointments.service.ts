import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  reason: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  doctor?: Doctor;
}

export interface CreateAppointmentPayload {
  patientId: string;
  doctorId: string;
  date: string;
  reason: string;
  notes?: string;
}

export interface UpdateAppointmentPayload {
  date?: string;
  reason?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getAppointments(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(
      `${this.apiUrl}/appointments?patientId=${encodeURIComponent(patientId)}`
    );
  }

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors`);
  }

  createAppointment(payload: CreateAppointmentPayload): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/appointments`, payload);
  }

  updateAppointment(id: string, payload: UpdateAppointmentPayload): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/appointments/${id}`, payload);
  }

  deleteAppointment(id: string): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.apiUrl}/appointments/${id}`);
  }
}
