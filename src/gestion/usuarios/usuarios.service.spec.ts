import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './entities/usuario.entity';
import { PersonaDocumento } from '../persona-documentos/entities/persona-documento.entity';
import { PersonasService } from '../personas/personas.service';
import { NotificationsService } from '../../common/notifications/notifications.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let notificationsService: NotificationsService;
  let usuarioRepository: any;
  let personasService: any;

  beforeEach(async () => {
    const mockNotifications = {
      sendBienvenidaEmail: jest.fn().mockResolvedValue(true),
    };
    
    const mockRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockImplementation(entity => ({ id: 1, ...entity })),
    };

    const mockPersonasService = {
      findById: jest.fn().mockResolvedValue({ id: 1, nombre: 'Test Name' }),
      findOne: jest.fn().mockResolvedValue({ id: 1, nombre: 'Test Name' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: getRepositoryToken(Usuario), useValue: mockRepo },
        { provide: getRepositoryToken(PersonaDocumento), useValue: {} },
        { provide: PersonasService, useValue: mockPersonasService },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    usuarioRepository = module.get(getRepositoryToken(Usuario));
    personasService = module.get(PersonasService);
  });

  describe('create', () => {
    it('no envia el password en texto plano al servicio de notificaciones', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'PlainPassword123!',
        rol_id: 2,
        persona_id: 1,
      };

      await service.create(dto);

      expect(notificationsService.sendBienvenidaEmail).toHaveBeenCalled();
      const callArgs = (notificationsService.sendBienvenidaEmail as jest.Mock).mock.calls[0];
      
      // La firma es sendBienvenidaEmail(email, nombre)
      expect(callArgs).not.toContain('PlainPassword123!');
      expect(callArgs[0]).toBe('test@example.com');
      expect(callArgs[1]).toBe('Test Name');
    });
  });
});
