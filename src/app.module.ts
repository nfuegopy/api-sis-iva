/* eslint-disable prettier/prettier */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos Core / Transversales
import { AuthModule } from './auth/auth.module';
import { AutorizacionModule } from './common/autorizacion.module';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationsModule } from './common/notifications/notifications.module';

// Gestión de Usuarios y Personas
import { UsuariosModule } from './gestion/usuarios/usuarios.module';
import { PersonasModule } from './gestion/personas/personas.module';
import { PersonaDocumentosModule } from './gestion/persona-documentos/persona-documentos.module';

// Geográficos
import { PaisModule } from './referenciales/geograficos/pais/pais.module';
import { DepartamentoModule } from './referenciales/geograficos/departamento/departamento.module';
import { CiudadModule } from './referenciales/geograficos/ciudad/ciudad.module';

// Parámetros del Sistema (Roles, Menús, Documentos)
import { RolesModule } from './referenciales/parametros/roles/roles.module';
import { MenuModule } from './referenciales/parametros/menu/menu.module';
import { GrupoMenuModule } from './referenciales/parametros/grupo-menu/grupo-menu.module';
import { MenuRolModule } from './referenciales/parametros/menu-rol/menu-rol.module';
import { TiposDocumentoModule } from './referenciales/parametros/tipos-documento/tipos-documento.module';

// Módulos de Negocio y Cobranzas (SaaS)
import { ContribuyentesModule } from './negocio/contribuyentes/contribuyentes.module';
import { ComprobantesModule } from './negocio/comprobantes/comprobantes.module';
import { ComprobantesVentasModule } from './negocio/comprobantes-ventas/comprobantes-ventas.module';
import { AsignacionesContablesModule } from './negocio/asignaciones-contables/asignaciones-contables.module';
import { SuscripcionesModule } from './negocio/suscripciones/suscripciones.module';
import { CuotasPagosModule } from './negocio/cuotas-pagos/cuotas-pagos.module';
import { OcrTaxModule } from './negocio/ocr-tax/ocr-tax.module';
import { ExportacionesModule } from './negocio/exportaciones/exportaciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      charset: 'utf8mb4',
      autoLoadEntities: true,
      synchronize: false,
    }),

    // Rate limiting global: 100 req/min por IP
    // El endpoint /auth/login tiene límite propio de 5/min via @Throttle
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    AuthModule,
    AutorizacionModule,
    FirebaseModule,
    NotificationsModule,

    UsuariosModule,
    PersonasModule,
    PersonaDocumentosModule,

    PaisModule,
    DepartamentoModule,
    CiudadModule,

    RolesModule,
    MenuModule,
    GrupoMenuModule,
    MenuRolModule,
    TiposDocumentoModule,

    ContribuyentesModule,
    ComprobantesModule,
    ComprobantesVentasModule,
    AsignacionesContablesModule,
    SuscripcionesModule,
    CuotasPagosModule,
    OcrTaxModule,
    ExportacionesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Aplica ThrottlerGuard globalmente a todas las rutas
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
