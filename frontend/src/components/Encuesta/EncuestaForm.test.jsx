import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EncuestaForm from './EncuestaForm';

// Mock de APIs para aislar el renderizado del componente
vi.mock('../../services/authApi', () => ({
  getGraduadoSesion: () => ({
    carnet_identidad: '8492041',
    nombres: 'Juan',
    apellidos: 'Perez',
    carrera: 'Ingeniería de Sistemas',
    correo_privado: 'juan.perez@gmail.com',
  }),
}));

vi.mock('../../services/encuestaApi', () => ({
  guardarEncuesta: vi.fn(),
  descargarCertificadoPdf: vi.fn(),
}));

describe('Pruebas de Usabilidad e Interacción Frontend (HU-03)', () => {
  it('Test 4 (CPS-03): Salto lógico condicional - Despliegue de motivo de cambio de carrera al seleccionar "Sí"', () => {
    // Renderizamos directamente en la Sección 2 (Trayectoria Académica)
    const { container } = render(<EncuestaForm pasoInicial={2} />);

    // Verificamos que inicialmente (por defecto en "No") la pregunta condicional 3.3 NO esté en pantalla
    const motivoInicial = screen.queryByLabelText(/Indique el motivo por el que cambió de carrera/i);
    expect(motivoInicial).toBeNull();

    // Localizamos específicamente el radio button de la pregunta 3.2 ("¿Cambió de carrera?")
    const radioSi = container.querySelector('input[name="S3P02_CambioCarrera"][value="Sí"]');
    expect(radioSi).toBeInTheDocument();

    // Simulamos el click en la opción "Sí"
    fireEvent.click(radioSi);

    // Verificamos que el campo de texto requerido se despliegue inmediatamente en el DOM
    const campoMotivo = screen.getByLabelText(/Indique el motivo por el que cambió de carrera/i);
    expect(campoMotivo).toBeInTheDocument();
    expect(campoMotivo.tagName).toBe('TEXTAREA');
  });
});
