const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const childProcess = require('child_process');
const Registry = require('winreg');

chai.use(chaiAsPromised);
chai.should();

describe('register protocol', () => {
  const handler = require('../');
  const testProtocol = 'registerprotocolwin32';
  const testCommand = '"C:\\registerprotocolwin32.exe" "%1"';
  const testIcon = 'C:\\registerprotocolwin32.ico';

  const key = '\\Software\\Classes\\' + testProtocol;

  if (process.platform !== 'win32') throw Exception('Tests must run under Windows platform');

  after(() => {
    var hkcu = handler.uninstall(testProtocol);
    var hkcr = handler.uninstall(testProtocol, { admin: true });

    Promise.all([hkcu, hkcr]);
  });

  it('should throw error when missing protocol', () => {
    expect(() => handler.install(null, null))
      .to.throw(Error);
  });

  it('should throw error when missing command', () => {
    expect(() => handler.install(testProtocol, null))
      .to.throw(Error);
  });

  it('should create protocol', () => {
    return handler.install(testProtocol, testCommand)
      .then(() => {
        const protocolKey = new Registry({
          hive: Registry.HKCU, // HKEY_CURRENT_USER
          key: key
        });

        const commandKey = new Registry({
          hive: Registry.HKCU, // HKEY_CURRENT_USER
          key: key + '\\shell\\open\\command'
        });

        const getProtocolKey = new Promise((resolve, reject) => {
          protocolKey.get('', (err, item) => {
            if (err) reject(err);
            resolve();
          });
        });

        const getCommandKey = new Promise((resolve, reject) => {
          commandKey.get('', (err, item) => {
            if (err) reject(err);
            if (item.value !== testCommand) reject();
            resolve();
          });
        });

        assert.isFulfilled(getProtocolKey);
        assert.isFulfilled(getCommandKey);
      });
  });

  it('should create protocol with icon', () => {
    return handler.install(testProtocol, testCommand, { icon: testIcon })
      .then(() => {
        const iconKey = new Registry({
          hive: Registry.HKCU, // HKEY_CURRENT_USER
          key: key + '\\DefaultIcon'
        });

        return new Promise((resolve, reject) => {
          iconKey.get('', (err, item) => {
            if (err) reject(err);
            if (item.value !== testIcon) reject();
            resolve();
          });
        }).should.be.fulfilled;
      });
  });

  // Requires Administrative Privileges
  it('should create protocol for all users (REQUIRES ADMIN)', () => {
    return handler.install(testProtocol, testCommand, { allUsers: true })
      .then(() => {
        const protocolKey = new Registry({
          hive: Registry.HKLM, // HKEY_LOCAL_MACHINE
          key: key
        });

        return new Promise((resolve, reject) => {
          protocolKey.get('', (err, item) => {
            if (err) reject(err);
            resolve();
          });
        }).should.be.fulfilled;
      },
      (err) => assert(false, err.toString()));
  });

  it('should delete protocol', () => {
    return handler.install(testProtocol, testCommand)
      .then(() => {
        return handler.uninstall(testProtocol)
          .then(() => {
            const protocolKey = new Registry({
              hive: Registry.HKCU, // HKEY_CURRENT_USER
              key: key
            });

            return new Promise((resolve, reject) => {
              protocolKey.keyExists((err, exists) => {
                exists ? reject('key still exists') : resolve();
              });
            }).should.be.fulfilled;

            //return assert.isFulfilled(getKey);
          })
          .catch((err) => assert(false, err.toString()));
    });
  });

  it('should return true if protocol exists', () => {
    return handler.install(testProtocol, testCommand)
      .then(() => {
        return handler.exists(testProtocol).should.eventually.equal(true);
      });
  });

  it('should return false if protocol does not exist', () => {
    return handler.install(testProtocol, testCommand)
      .then(() => {
        return handler.uninstall(testProtocol)
          .then(() => {
            return handler.exists(testProtocol).should.eventually.equal(false);
          });
    })
  });
});
