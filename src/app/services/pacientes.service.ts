import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData,
         doc, updateDoc, deleteDoc, CollectionReference,
         query, where } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, of, switchMap } from 'rxjs';
import { Paciente } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  private getPacientesCollection(): CollectionReference {
    return collection(this.firestore, 'pacientes');
  }

  getPacientes(): Observable<Paciente[]> {
    // Espera a que Auth confirme el usuario antes de consultar
    return authState(this.auth).pipe(
      switchMap(user => {
        if (!user) return of([]);
        const q = query(
          this.getPacientesCollection(),
          where('ownerId', '==', user.uid)
        );
        return collectionData(q, { idField: 'id' }) as Observable<Paciente[]>;
      })
    );
  }

  addPaciente(paciente: Paciente): Promise<any> {
    // Espera a que Auth confirme el usuario antes de guardar
    return new Promise((resolve, reject) => {
      authState(this.auth).pipe(
        switchMap(user => {
          if (!user) throw new Error('Usuario no autenticado');
          const pacienteConOwner = { ...paciente, ownerId: user.uid };
          return addDoc(this.getPacientesCollection(), pacienteConOwner);
        })
      ).subscribe({ next: resolve, error: reject });
    });
  }

  updatePaciente(id: string, paciente: Partial<Paciente>): Promise<void> {
    const pacienteDoc = doc(this.firestore, `pacientes/${id}`);
    return updateDoc(pacienteDoc, paciente);
  }

  deletePaciente(id: string): Promise<void> {
    const pacienteDoc = doc(this.firestore, `pacientes/${id}`);
    return deleteDoc(pacienteDoc);
  }
}