const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const childProcess = require('child_process');
const Registry = require('winreg');

chai.use(chaiAsPromised);

describe('register protocol', () => {
  const handler = require('../');
  const testProtocol = 'registerprotocolwin32';
  const testDescription = 'test';
  const testCommand = '"C:\\registerprotocolwin32.exe" "%1"';
  const testIcon = 'C:\\registerprotocolwin32.ico';

  if (process.platform !== 'win32') throw Exception('Tests must run under Windows platform');

  after(() => {
    var hkcu = handler.uninstall(testProtocol);
    var hkcr = handler.uninstall(testProtocol, { admin: true });

    Promise.all([hkcu, hkcr]);
  });

  it('should throw error when missing protocol', () => {
    expect(() => handler.install(null, null, null))
      .to.throw(Error);
  });

  it('should throw error when missing description', () => {
    expect(() => handler.install(testProtocol, null, null))
      .to.throw(Error);
  });

  it('should throw error when missing command', () => {
    expect(() => handler.install(testProtocol, testDescription, null))
      .to.throw(Error);
  });

  it('should create protocol', () => {
    return handler.install(testProtocol, testDescription, testCommand)
      .then(() => {
        const protocolKey = new Registry({
          hive: Registry.HKCU, // HKEY_CURRENT_USER
          key: '\\Software\\Classes\\' + testProtocol
        });

        const commandKey = new Registry({
          hive: Registry.HKCU, // HKEY_CURRENT_USER
          key: '\\Software\\Classes\\' + testProtocol + '\\shell\\open\\command'
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
    return handler.install(testProtocol, testDescription, testCommand, { icon: testIcon })
      .then(() => {
        const iconKey = new Registry({
          hive: Registry.HKCU, // HKEY_CURRENT_USER
          key: '\\Software\\Classes\\' + testProtocol + '\\DefaultIcon'
        });

        const getIconKey = new Promise((resolve, reject) => {
          iconKey.get('', (err, item) => {
            if (err) reject(err);
            if (item.value !== testIcon) reject();
            resolve();
          });
        });

        assert.isFulfilled(getIconKey);
      });
  });

  it('should create protocol in HKCR when admin', () => {
    return isAdmin()
      .then(() => {
        return handler.install(testProtocol, testDescription, testCommand, { admin: true })
          .then(() => {
            const protocolKey = new Registry({
              hive: Registry.HKCR, // HKEY_CURRENT_ROOT
              key: '\\Software\\Classes\\' + testProtocol
            });

            const getKey = new Promise((resolve, reject) => {
              protocolKey.get('', (err, item) => {
                if (err) reject(err);
                resolve();
              });
            });

            return assert.isFulfilled(getKey);
          })
          .catch((err) => assert(false, err.toString()));
      })
      .catch((err) => {
        const install = handler.install(testProtocol, testDescription, testCommand, { admin: true });
        return assert.isRejected(install, /Access is denied/, err);
      });
  });

  it('should delete protocol', () => {
    return handler.install(testProtocol, testDescription, testCommand)
      .then(() => {
        return handler.uninstall(testProtocol)
          .then(() => {
            const protocolKey = new Registry({
              hive: Registry.HKCU, // HKEY_CURRENT_USER
              key: '\\Software\\Classes\\' + testProtocol
            });

            const getKey = new Promise((resolve, reject) => {
              protocolKey.keyExists((err, exists) => {
                exists ? reject('key still exists') : resolve();
              });
            });

            return assert.isFulfilled(getKey);
          })
          .catch((err) => assert(false, err.toString()));
    });
  });

  function isAdmin() {
    return new Promise((resolve, reject) => {
      // http://stackoverflow.com/a/11995662/64949
      childProcess.execFile('net.exe', ['session'], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

});
