export interface Paciente {
  id?: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: Date;
  domicilio: string;
  correoElectronico: string;
  ownerId?: string;  
}