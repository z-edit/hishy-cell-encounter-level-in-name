/* global ngapp, xelib */
registerPatcher({
    info: info,
    gameModes: [xelib.gmTES5, xelib.gmSSE],
    settings: {
        label: 'Cell Encounter Levels In Name',
        templateUrl: `${patcherPath}/partials/settings.html`,
        defaultSettings: {
            formulaRangedLeveled: '{name} [{min} ~ {max}]',
            formulaDeleveled: '{name} [{min}]',
            formulaLeveled: '{name} [{min}+]'
        }
    },
    requiredFiles: [],
    getFilesToPatch: function(filenames) {
        return filenames;
    },
    execute: {
        initialize: function(patch, helpers, settings, locals) {
            // Perform anything that needs to be done once at the beginning of the
            // patcher's execution here.  This can be used to cache records which don't
            // need to be patched, but need to be referred to later on.  Store values
            // on the locals variable to refer to them later in the patching process.
        },
        process: [{
            load: function(plugin, helpers, settings, locals) {
                // return a falsy value to skip loading/patching any records from a plugin
                // return an object specifying the signature to load, and a filter
                // function which returns true if a record should be patched.
                return {
                    signature: 'CELL',
                    filter: function(record) {
                        return xelib.HasElement(record, 'FULL') && xelib.HasElement(record, 'XEZN') && xelib.GetFlag(record, 'DATA', 'Is Interior Cell');
                    }
                }
            },
            patch: function(record, helpers, settings, locals) {
                // change values on the record as required
                // you can also remove the record here, but it is discouraged.
                // (try to use filters instead.)
                //helpers.logMessage(xelib.FullName(record));
                let name = xelib.FullName(record);
                let eczn = xelib.GetLinksTo(record, 'XEZN');
                let min = xelib.GetUIntValue(eczn, 'DATA\\Min Level');
                let max = xelib.GetUIntValue(eczn, 'DATA\\Max Level');

                let formula = settings.formulaLeveled;

                if (min < max) {
                    formula = settings.formulaRangedLeveled;
                } else if (min == max) {
                    formula = settings.formulaDeleveled;
                }

                name = formula.replace(/{name}/g, name);
                name = name.replace(/{min}/g, min);
                name = name.replace(/{max}/g, max);

                helpers.logMessage(name);
                xelib.SetValue(record, 'FULL', name);
            }
        }],
        finalize: function(patch, helpers, settings, locals) {
            // perform any cleanup here
            // note that the framework automatically removes unused masters as
            // well as ITPO and ITM records, so you don't need to do that
        }
    }
});