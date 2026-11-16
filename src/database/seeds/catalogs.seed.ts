import { DataSource } from 'typeorm';
import { Role } from '../../referenciales/parametros/roles/entities/role.entity';
import { GrupoMenu } from '../../referenciales/parametros/grupo-menu/entities/grupo-menu.entity';
import { Menu } from '../../referenciales/parametros/menu/entities/menu.entity';
import { MenuRol } from '../../referenciales/parametros/menu-rol/entities/menu-rol.entity';

const rolesData = [
  { nombre: 'Administrador', descripcion: 'Acceso total y configuración del sistema.' },
  { nombre: 'Contador', descripcion: 'Rol operativo para registrar, revisar y validar comprobantes.' },
  { nombre: 'Solo Lectura', descripcion: 'Rol de consulta sin permisos de modificación.' }
];

const gruposMenuData = [
  { nombre: 'Negocio', descripcion: undefined, icono: undefined },
  { nombre: 'Seguridad', descripcion: undefined, icono: undefined },
  { nombre: 'Cobranzas', descripcion: undefined, icono: undefined },
  { nombre: 'Gestión', descripcion: undefined, icono: undefined },
  { nombre: 'Referenciales', descripcion: undefined, icono: undefined }
];

const menuData = [
  { nombre: 'Comprobantes', url: '/negocio/comprobantes', icono: 'receipt', grupo: 'Negocio' },
  { nombre: 'Contribuyentes', url: '/negocio/contribuyentes', icono: 'business', grupo: 'Negocio' },
  { nombre: 'Exportaciones RG90', url: '/negocio/exportaciones', icono: 'download', grupo: 'Negocio' },
  { nombre: 'OCR - Extraer Comprobante', url: '/ocr-tax', icono: 'document_scanner', grupo: 'Negocio' },
  { nombre: 'Asignaciones Contables', url: '/negocio/asignaciones-contables', icono: 'assignment_ind', grupo: 'Negocio' },
  { nombre: 'Usuarios', url: '/usuarios', icono: 'people', grupo: 'Seguridad' },
  { nombre: 'Roles', url: '/roles', icono: 'admin_panel_settings', grupo: 'Seguridad' },
  { nombre: 'Menú', url: '/menu', icono: 'menu', grupo: 'Seguridad' },
  { nombre: 'Grupos de Menú', url: '/grupo-menu', icono: 'folder', grupo: 'Seguridad' },
  { nombre: 'Permisos', url: '/menu-rol', icono: 'lock', grupo: 'Seguridad' },
  { nombre: 'Suscripciones', url: '/cobranzas/suscripciones', icono: 'subscriptions', grupo: 'Cobranzas' },
  { nombre: 'Cuotas y Pagos', url: '/cobranzas/cuotas-pagos', icono: 'payments', grupo: 'Cobranzas' },
  { nombre: 'Personas', url: '/personas', icono: 'person', grupo: 'Gestión' },
  { nombre: 'Documentos de Personas', url: '/persona-documentos', icono: 'badge', grupo: 'Gestión' },
  { nombre: 'Tipos de Documento', url: '/tipos-documento', icono: 'description', grupo: 'Referenciales' },
  { nombre: 'Países', url: '/pais', icono: 'public', grupo: 'Referenciales' },
  { nombre: 'Comprobantes de Venta', url: '/negocio/comprobantes-ventas', icono: 'receipt_long', grupo: 'Negocio' }
];

const menuRolData = [
  ...menuData.map(m => ({ rol: 'Administrador', menuUrl: m.url, pL: true, pG: true, pE: true, pE_D: true })),
  
  { rol: 'Contador', menuUrl: '/negocio/comprobantes', pL: true, pG: true, pE: true, pE_D: false },
  { rol: 'Contador', menuUrl: '/negocio/contribuyentes', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Contador', menuUrl: '/negocio/exportaciones', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Contador', menuUrl: '/ocr-tax', pL: false, pG: true, pE: false, pE_D: false },
  { rol: 'Contador', menuUrl: '/negocio/asignaciones-contables', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Contador', menuUrl: '/cobranzas/suscripciones', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Contador', menuUrl: '/cobranzas/cuotas-pagos', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Contador', menuUrl: '/personas', pL: true, pG: true, pE: true, pE_D: false },
  { rol: 'Contador', menuUrl: '/persona-documentos', pL: true, pG: true, pE: true, pE_D: false },
  { rol: 'Contador', menuUrl: '/tipos-documento', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Contador', menuUrl: '/pais', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Contador', menuUrl: '/negocio/comprobantes-ventas', pL: true, pG: false, pE: true, pE_D: false },
  
  { rol: 'Solo Lectura', menuUrl: '/negocio/comprobantes', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Solo Lectura', menuUrl: '/negocio/contribuyentes', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Solo Lectura', menuUrl: '/negocio/exportaciones', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Solo Lectura', menuUrl: '/negocio/asignaciones-contables', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Solo Lectura', menuUrl: '/cobranzas/suscripciones', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Solo Lectura', menuUrl: '/cobranzas/cuotas-pagos', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Solo Lectura', menuUrl: '/personas', pL: true, pG: false, pE: false, pE_D: false },
  { rol: 'Solo Lectura', menuUrl: '/negocio/comprobantes-ventas', pL: true, pG: false, pE: false, pE_D: false }
];

export async function runCatalogsSeed(dataSource: DataSource) {
  const rolRepo = dataSource.getRepository(Role);
  const grupoMenuRepo = dataSource.getRepository(GrupoMenu);
  const menuRepo = dataSource.getRepository(Menu);
  const menuRolRepo = dataSource.getRepository(MenuRol);

  let rolesCount = 0;
  let gruposCount = 0;
  let menusCount = 0;
  let menuRolesCount = 0;

  console.log('--- Iniciando Seed de Catálogos ---');

  for (const data of rolesData) {
    let rol = await rolRepo.findOne({ where: { nombre: data.nombre } });
    if (!rol) {
      rol = rolRepo.create(data);
    } else {
      rol.descripcion = data.descripcion!;
    }
    await rolRepo.save(rol);
    rolesCount++;
  }

  for (const data of gruposMenuData) {
    let grupo = await grupoMenuRepo.findOne({ where: { nombre: data.nombre } });
    if (!grupo) {
      grupo = grupoMenuRepo.create(data);
    } else {
      grupo.descripcion = data.descripcion as unknown as string;
      grupo.icono = data.icono as unknown as string;
    }
    await grupoMenuRepo.save(grupo);
    gruposCount++;
  }

  for (const data of menuData) {
    const grupo = await grupoMenuRepo.findOne({ where: { nombre: data.grupo } });
    if (!grupo) {
      console.warn(`Grupo de menú no encontrado: ${data.grupo}`);
      continue;
    }

    let menu = await menuRepo.findOne({ where: { url: data.url } });
    if (!menu) {
      menu = menuRepo.create({
        nombre: data.nombre,
        url: data.url,
        icono: data.icono,
        grupo_menu_id: grupo.id,
      });
    } else {
      menu.nombre = data.nombre;
      menu.icono = data.icono;
      menu.grupo_menu_id = grupo.id;
    }
    await menuRepo.save(menu);
    menusCount++;
  }

  for (const data of menuRolData) {
    const rol = await rolRepo.findOne({ where: { nombre: data.rol } });
    const menu = await menuRepo.findOne({ where: { url: data.menuUrl } });

    if (!rol || !menu) {
      console.warn(`No se encontró Rol (${data.rol}) o Menú (${data.menuUrl}) para MenuRol`);
      continue;
    }

    let menuRol = await menuRolRepo.findOne({
      where: { rol_id: rol.id, menu_id: menu.id }
    });

    if (!menuRol) {
      menuRol = menuRolRepo.create({
        rol_id: rol.id,
        menu_id: menu.id,
        permitir_listar: data.pL,
        permitir_guardar: data.pG,
        permitir_editar: data.pE,
        permitir_eliminar: data.pE_D
      });
    } else {
      menuRol.permitir_listar = data.pL;
      menuRol.permitir_guardar = data.pG;
      menuRol.permitir_editar = data.pE;
      menuRol.permitir_eliminar = data.pE_D;
    }
    await menuRolRepo.save(menuRol);
    menuRolesCount++;
  }

  console.log('--- Seed Completado ---');
  console.log(`Roles procesados: ${rolesCount}`);
  console.log(`Grupos procesados: ${gruposCount}`);
  console.log(`Menús procesados: ${menusCount}`);
  console.log(`Permisos procesados: ${menuRolesCount}`);
}
