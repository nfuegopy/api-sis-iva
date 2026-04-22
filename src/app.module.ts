/* eslint-disable prettier/prettier */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos Core / Transversales
import { AuthModule } from './auth/auth.module';
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

// ==========================================
// Módulos de Negocio y Cobranzas (SaaS)
// ==========================================
import { ContribuyentesModule } from './negocio/contribuyentes/contribuyentes.module';
import { ComprobantesModule } from './negocio/comprobantes/comprobantes.module';
import { AsignacionesContablesModule } from './negocio/asignaciones-contables/asignaciones-contables.module';
import { SuscripcionesModule } from './negocio/suscripciones/suscripciones.module';
import { CuotasPagosModule } from './negocio/cuotas-pagos/cuotas-pagos.module';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Conexión a Base de Datos (Asegúrate que coincida con tu .env)
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true, // ¡OJO! En producción poner en false
    }),

    // Módulos de Infraestructura
    AuthModule,
    FirebaseModule,
    NotificationsModule,

    // Módulos de Gestión
    UsuariosModule,
    PersonasModule,
    PersonaDocumentosModule,

    // Referenciales Geográficos
    PaisModule,
    DepartamentoModule,
    CiudadModule,

    // Referenciales de Sistema
    RolesModule,
    MenuModule,
    GrupoMenuModule,
    MenuRolModule,
    TiposDocumentoModule,

    // Módulos de Negocio SaaS
    ContribuyentesModule,
    ComprobantesModule,
    AsignacionesContablesModule,
    SuscripcionesModule,
    CuotasPagosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
