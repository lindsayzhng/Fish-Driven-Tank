import app from '../../src/app';

describe('\'drive\' service', () => {
  it('registered the service', () => {
    const service = app.service('drive');
    expect(service).toBeTruthy();
  });
});
