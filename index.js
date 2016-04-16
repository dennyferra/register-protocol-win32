var path = require('path');
var Registry = require('winreg');

function install(protocol, description, command, opts) {
  if (typeof protocol !== 'string') throw new Error('parameter `protocol` is required');
  if (typeof description !== 'string') throw new Error('parameter `description` is required');
  if (typeof command !== 'string') throw new Error('parameter `command` is required');

  opts = extend({
    admin: false,
    icon: null
  }, opts);

  // By default we write to "HKEY_CURRENT USER" which does not need admin
  // privileges and gets inherited by "HKEY_CLASSES_ROOT". If admin option is
  // used then we write to "HKEY_CLASSES_ROOT" assuming this is being called
  // by a process with admin privileges.
  var hive = opts.admin ? Registry.HKCR : Registry.HKCU;

  return new Promise(function(resolve, reject) {
    var protocolKey = new Registry({
      hive: hive,
      key: '\\Software\\Classes\\' + protocol
    });

    setProtocol();

    function setProtocol() {
      protocolKey.set('', Registry.REG_SZ, protocol, setUrlProtocol);
    }

    function setUrlProtocol(err) {
      if (err) reject(err);
      protocolKey.set('URL Protocol', Registry.REG_SZ, '', setCommand);
    }

    function setCommand (err) {
      if (err) reject(err);
      var commandKey = new Registry({
        hive: hive,
        key: '\\Software\\Classes\\' + protocol + '\\shell\\open\\command'
      });

      var optionalOrDone = opts.icon ? setIcon : done;
      commandKey.set('', Registry.REG_SZ, command, optionalOrDone);
    }

    function setIcon(err) {
      if (err) reject(err);
      var iconKey = new Registry({
        hive: hive,
        key: '\\Software\\Classes\\' + protocol + '\\DefaultIcon'
      });

      iconKey.set('', Registry.REG_SZ, opts.icon, done);
    }

    function done(err) {
      if (err) reject();
      resolve(err);
    }
  });
}

function uninstall(protocol, opts) {
  opts = extend({
    admin: false
  }, opts);

  // By default we write to "HKEY_CURRENT USER" which does not need admin
  // privileges and gets inherited by "HKEY_CLASSES_ROOT". If admin option is
  // used then we write to "HKEY_CLASSES_ROOT" assuming this is being called
  // by a process with admin privileges.
  var hive = opts.admin ? Registry.HKCR : Registry.HKCU;

  return new Promise(function(resolve, reject) {
    var protocolKey = new Registry({
      hive: hive,
      key: '\\Software\\Classes\\' + protocol
    });

    protocolKey.destroy(function(err) {
      if (err) reject(err);
      resolve();
    });
  });
}

function extend() {
  for(var i=1; i<arguments.length; i++)
      for(var key in arguments[i])
          if(arguments[i].hasOwnProperty(key))
              arguments[0][key] = arguments[i][key];
  return arguments[0];
}

module.exports = {
  install,
  uninstall
}
