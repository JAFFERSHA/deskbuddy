/* Gives the shared settings page the `browser` storage API it expects, backed by the DeskBuddy web app that hosts it. */
(function () {
  var app = window.parent && window.parent.DBApp;
  function area(name) {
    return {
      get: function (key) { var o = {}; o[key] = app ? app.get(name, key) : undefined; return Promise.resolve(o); },
      set: function (obj) { if (app) app.set(name, obj); return Promise.resolve(); }
    };
  }
  window.browser = {
    storage: { sync: area('sync'), local: area('local') },
    runtime: { sendMessage: function (m) { return Promise.resolve(app ? app.message(m) : { ok: true }); } }
  };
})();
