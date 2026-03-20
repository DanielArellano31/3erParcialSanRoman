import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import {
  AppointmentsService,
  Appointment,
  Doctor,
} from '../../services/appointments.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
})
export class AppointmentsComponent implements OnInit {
  user$: Observable<any>;
  currentUser: any = null;

  appointments: Appointment[] = [];
  doctors: Doctor[] = [];

  appointmentForm: FormGroup;
  editingId: string | null = null;

  loading = false;
  loadingDoctors = false;
  error: string | null = null;
  success: string | null = null;

  readonly statusOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmada' },
    { value: 'cancelled', label: 'Cancelada' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private appointmentsService: AppointmentsService,
    private router: Router
  ) {
    this.user$ = this.authService.user$;

    this.appointmentForm = this.fb.group({
      doctorId: ['', Validators.required],
      date: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
      notes: ['', Validators.maxLength(500)],
      status: ['pending'],
    });
  }

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.loadAppointments();
        this.loadDoctors();
      }
    });
  }

  loadAppointments(): void {
    if (!this.currentUser) return;
    this.loading = true;
    this.error = null;

    this.appointmentsService.getAppointments(this.currentUser.uid).subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las citas. ¿Está corriendo la API en localhost:3000?';
        this.loading = false;
      },
    });
  }

  loadDoctors(): void {
    this.loadingDoctors = true;
    this.appointmentsService.getDoctors().subscribe({
      next: (data) => {
        this.doctors = data;
        this.loadingDoctors = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los doctores. ¿Está corriendo la API?';
        this.loadingDoctors = false;
      },
    });
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.markAllTouched();
      return;
    }

    const v = this.appointmentForm.value;
    this.error = null;
    this.success = null;

    if (this.editingId) {
      const payload = {
        date: v.date,
        reason: v.reason,
        notes: v.notes || undefined,
        status: v.status,
      };

      this.appointmentsService.updateAppointment(this.editingId, payload).subscribe({
        next: () => {
          this.success = 'Cita actualizada correctamente.';
          this.resetForm();
          this.loadAppointments();
        },
        error: () => (this.error = 'Error al actualizar la cita.'),
      });
    } else {
      const payload = {
        patientId: this.currentUser.uid,
        doctorId: v.doctorId,
        date: v.date,
        reason: v.reason,
        notes: v.notes || undefined,
      };

      this.appointmentsService.createAppointment(payload).subscribe({
        next: () => {
          this.success = 'Cita creada correctamente.';
          this.resetForm();
          this.loadAppointments();
        },
        error: () => (this.error = 'Error al crear la cita.'),
      });
    }
  }

  editAppointment(a: Appointment): void {
    this.editingId = a.id;
    this.success = null;
    this.error = null;

    const localDate = new Date(a.date);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;

    this.appointmentForm.patchValue({
      doctorId: a.doctorId,
      date: dateStr,
      reason: a.reason,
      notes: a.notes || '',
      status: a.status,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteAppointment(id: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cita?')) return;

    this.appointmentsService.deleteAppointment(id).subscribe({
      next: () => {
        this.success = 'Cita eliminada.';
        this.loadAppointments();
      },
      error: () => (this.error = 'Error al eliminar la cita.'),
    });
  }

  resetForm(): void {
    this.appointmentForm.reset({ status: 'pending' });
    this.editingId = null;
  }

  markAllTouched(): void {
    Object.values(this.appointmentForm.controls).forEach((c) => c.markAsTouched());
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge bg-warning text-dark',
      confirmed: 'badge bg-success',
      cancelled: 'badge bg-danger',
    };
    return map[status] ?? 'badge bg-secondary';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
    };
    return map[status] ?? status;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getUpcoming(): Appointment[] {
    const now = new Date();
    return this.appointments.filter(
      (a) => new Date(a.date) >= now && a.status !== 'cancelled'
    );
  }

  getPast(): Appointment[] {
    const now = new Date();
    return this.appointments.filter(
      (a) => new Date(a.date) < now || a.status === 'cancelled'
    );
  }

  logout(): void {
    this.authService.logout().then(() => this.router.navigate(['/login']));
  }
}
