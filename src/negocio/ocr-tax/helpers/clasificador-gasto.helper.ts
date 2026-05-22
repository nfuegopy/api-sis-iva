/* eslint-disable prettier/prettier */
import { TipoGastoIRP } from '../../comprobantes/entities/comprobante.entity';

export class ClasificadorGastoHelper {
  static clasificarPorRazonSocial(razonSocial: string): TipoGastoIRP {
    if (!razonSocial || razonSocial === 'A CONFIRMAR') {
      return TipoGastoIRP.OTROS;
    }

    const texto = razonSocial.toUpperCase();

    // 1. SALUD
    if (
      /(FARMA|SANATORIO|CLINICA|HOSPITAL|MEDIC|ODONTOLOG|LABORATORIO|VISION)/.test(
        texto,
      )
    ) {
      return TipoGastoIRP.SALUD;
    }

    // 2. ALIMENTACIÓN
    if (
      /(SUPERMERCADO|DESPENSA|COMERCIAL|MINIMARKET|RETAIL|FRIGORIFICO|ABASTO|BODEGA|PANADERIA|RESTAURANT|GASTRONOMI|ALIMENTO)/.test(
        texto,
      )
    ) {
      return TipoGastoIRP.ALIMENTACION;
    }

    // 3. EDUCACIÓN
    if (
      /(COLEGIO|ESCUELA|UNIV|INSTITUTO|EDUC|LIBRERIA|UTILES|PAPELERIA)/.test(
        texto,
      )
    ) {
      return TipoGastoIRP.EDUCACION;
    }

    // 4. VIVIENDA / SERVICIOS
    if (
      /(ANDE|ESSAP|COPACO|INMOBILIARIA|FERRETERIA|CONSTRUCTORA|PINTURAS|HOGAR|MUEBLES)/.test(
        texto,
      )
    ) {
      return TipoGastoIRP.VIVIENDA;
    }

    // 5. VESTIMENTA
    if (/(TIENDA|BOUTIQUE|CALZADOS|ROPA|TEXTIL|CONFECCIONES)/.test(texto)) {
      return TipoGastoIRP.VESTIMENTA;
    }

    // Si no encuentra una palabra clave fuerte, asigna OTROS para que el contador lo defina
    return TipoGastoIRP.OTROS;
  }
}
