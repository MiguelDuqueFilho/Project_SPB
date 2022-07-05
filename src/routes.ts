import { Router } from 'express';
import { CreateClientController } from './modules/clients/useCases/createClient/CreateClientController';
import { AuthenticateUserController } from './modules/account/authenticateUser/AuthenticateUserController';
import { LoadCatalogController } from './modules/catalog/loadCatalog/LoadCatalogController';

const routes = Router();

const createClientController = new CreateClientController();
const authenticateUserController = new AuthenticateUserController();
const loadCatalogController = new LoadCatalogController();

routes.get('/upload', loadCatalogController.handle);
routes.post('/client', createClientController.handle);
routes.post('/authenticate', authenticateUserController.handle);

export { routes };
