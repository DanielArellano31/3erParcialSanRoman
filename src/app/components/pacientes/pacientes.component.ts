import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { PacientesService } from '../../services/pacientes.service';
import { AuthService } from '../../services/auth.service';
import { Paciente } from '../../models/paciente.model';
import { EmailFormatPipe } from '../../pipes/email-format.pipe';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmailFormatPipe],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {

  pacienteForm: FormGroup;
  pacientes: Paciente[] = [];
  editingId: string | null = null;
  user$: Observable<any>;

  // Regex para validar solo letras y espacios
  readonly soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  constructor(
    private fb: FormBuilder,
    private pacientesService: PacientesService,
    private authService: AuthService,
    private router: Router
  ) {

    // ✅ CORRECCIÓN DEL ERROR TS2729
    this.user$ = this.authService.user$;

    this.pacienteForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(80),
        Validators.pattern(this.soloLetrasRegex)
      ]],
      apellidos: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200),
        Validators.pattern(this.soloLetrasRegex)
      ]],
      fechaNacimiento: ['', Validators.required],
      domicilio: ['', Validators.required],
      correoElectronico: ['', [
        Validators.required,
        Validators.email
      ]]
    });
  }

  ngOnInit(): void {
    this.loadPacientes();
  }

  loadPacientes(): void {
    this.pacientesService.getPacientes().subscribe({
      next: (data) => {
        this.pacientes = data;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
        alert('Error al cargar la lista de pacientes');
      }
    });
  }

  onSubmit(): void {
    if (this.pacienteForm.valid) {

      const paciente: Paciente = {
        ...this.pacienteForm.value,
        fechaNacimiento: new Date(this.pacienteForm.value.fechaNacimiento)
      };

      if (this.editingId) {
        this.updatePaciente(paciente);
      } else {
        this.addPaciente(paciente);
      }

    } else {
      this.markFormGroupTouched(this.pacienteForm);
      alert('Por favor, completa todos los campos correctamente');
    }
  }

  addPaciente(paciente: Paciente): void {
    this.pacientesService.addPaciente(paciente)
      .then(() => {
        alert('✅ Paciente agregado exitosamente');
        this.resetForm();
        this.loadPacientes();
      })
      .catch(error => {
        console.error('Error al agregar paciente:', error);
        alert('❌ Error al agregar el paciente');
      });
  }

  updatePaciente(paciente: Paciente): void {
    if (!this.editingId) return;

    this.pacientesService.updatePaciente(this.editingId, paciente)
      .then(() => {
        alert('✅ Paciente actualizado exitosamente');
        this.resetForm();
        this.loadPacientes();
      })
      .catch(error => {
        console.error('Error al actualizar paciente:', error);
        alert('❌ Error al actualizar el paciente');
      });
  }

  editPaciente(paciente: Paciente): void {
    this.editingId = paciente.id || null;

    const fechaFormateada = this.formatDateForInput(paciente.fechaNacimiento);

    this.pacienteForm.patchValue({
      nombre: paciente.nombre,
      apellidos: paciente.apellidos,
      fechaNacimiento: fechaFormateada,
      domicilio: paciente.domicilio,
      correoElectronico: paciente.correoElectronico
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePaciente(id: string | undefined): void {
    if (!id) return;

    if (confirm('¿Estás seguro de eliminar este paciente?')) {
      this.pacientesService.deletePaciente(id)
        .then(() => {
          alert('✅ Paciente eliminado exitosamente');
          this.loadPacientes();
        })
        .catch(error => {
          console.error('Error al eliminar paciente:', error);
          alert('❌ Error al eliminar el paciente');
        });
    }
  }

  resetForm(): void {
    this.pacienteForm.reset();
    this.editingId = null;
  }

 formatDateForInput(date: any): string {
  if (!date) return '';

  // Timestamp de Firestore
  if (date?.toDate) {
    return date.toDate().toISOString().split('T')[0];
  }

  // Date normal
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }

  // String
  return String(date).split('T')[0];
}
getfecha(date: any): Date {
  if (!date) return new Date();
  if (date?.toDate) return date.toDate();
  if (date instanceof Date) return date;
  return new Date(date);
}

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}