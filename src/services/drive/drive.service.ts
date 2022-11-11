// Initializes the `drive` service on path `/drive`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Drive } from './drive.class';
import hooks from './drive.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'drive': Drive & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/drive', new Drive(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('drive');

  service.hooks(hooks);
}
