import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { init } from 'raspi';
import { SoftPWM } from 'raspi-soft-pwm';

interface Data {
  rf: number, rb: number, lf: number, lb: number
}

interface ServiceOptions { }

var rightMotorForward: SoftPWM;
var rightMotorBackward: SoftPWM;
var leftMotorForward: SoftPWM;
var leftMotorBackward: SoftPWM;


export class Drive implements ServiceMethods<Data> {
  app: Application;
  options: ServiceOptions;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
    console.log(process.getgroups && process.getgroups());
    init(() => {
      rightMotorForward = new SoftPWM('GPIO18');
      rightMotorBackward = new SoftPWM('GPIO19');
      leftMotorForward = new SoftPWM('GPIO13');
      leftMotorBackward = new SoftPWM('GPIO12');
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find(params?: Params): Promise<Data[] | Paginated<Data>> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(id: Id, params?: Params): Promise<Data> {
    return {
      power: 0
    } as any;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: Data, params?: Params): Promise<Data> {

    console.log(data)
    const { rf, rb, lf, lb } = data;

    rightMotorForward.write(rf ?? 0);
    rightMotorBackward.write(rb ?? 0);
    leftMotorForward.write(lf ?? 0)
    leftMotorBackward.write(lb ?? 0);



    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async patch(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove(id: NullableId, params?: Params): Promise<Data> {
    return { power: 0 } as any;
  }
}
