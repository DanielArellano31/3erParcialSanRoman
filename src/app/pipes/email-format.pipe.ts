import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'emailFormat',
  standalone: true
})
export class EmailFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    
    // Convertir a minúsculas y eliminar espacios
    let email = value.toLowerCase().trim();
    
    // Resaltar el formato visualmente
    if (email.includes('@')) {
      const parts = email.split('@');
      return `${parts[0]} @ ${parts[1]}`;
    }
    
    return email;
  }
}