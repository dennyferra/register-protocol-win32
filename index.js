var path = require('path');
var Registry = require('winreg');

function install(protocol, command, opts) {
  if (typeof protocol !== 'string') throw new Error('parameter `protocol` is required');
  if (typeof command !== 'string') throw new Error('parameter `command` is required');

  var o = getOpts(protocol, opts);
  opts = o.opts;
  var hive = o.hive;
  var key = o.key;

  return new Promise(function(resolve, reject) {
    var protocolKey = new Registry({
      hive: hive,
      key: key
    });

    setProtocol();

    function setProtocol() {
      var value = 'URL:' + protocol + ' protocol';
      protocolKey.set('', Registry.REG_SZ, value, setUrlProtocol);
    }

    function setUrlProtocol(err) {
      if (err) reject(err);
      protocolKey.set('URL Protocol', Registry.REG_SZ, '', setCommand);
    }

    function setCommand (err) {
      if (err) reject(err);
      var commandKey = new Registry({
        hive: hive,
        key: key + '\\shell\\open\\command'
      });

      var optionalOrDone = opts.icon ? setIcon : done;
      commandKey.set('', Registry.REG_SZ, command, optionalOrDone);
    }

    function setIcon(err) {
      if (err) reject(err);
      var iconKey = new Registry({
        hive: hive,
        key: key + '\\DefaultIcon'
      });

      iconKey.set('', Registry.REG_SZ, opts.icon, done);
    }

    function done(err) {
      if (err) reject(err);
      resolve();
    }
  });
}

function uninstall(protocol, opts) {
  if (typeof protocol !== 'string') throw new Error('parameter `protocol` is required');

  var o = getOpts(protocol, opts);
  opts = o.opts;
  var hive = o.hive;
  var key = o.key;

  return new Promise(function(resolve, reject) {
    var protocolKey = new Registry({
      hive: hive,
      key: key
    });

    protocolKey.destroy(function(err) {
      if (err) reject(err);
      resolve();
    });
  });
}

function getOpts(protocol, opts) {
  opts = extend({
    allUsers: false,
    icon: null
  }, opts);

  // By default we write to "HKEY_CURRENT USER" unless allUsers is true in
  // which case we write to "HKEY_LOCAL_MACHINE" to apply protocol to all users
  return {
    opts: opts,
    hive: opts.allUsers ? Registry.HKLM : Registry.HKCU,
    key: '\\Software\\Classes\\' + protocol
  }
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
