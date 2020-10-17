/* This extension is a derived work of the Gnome Shell.
*
* Copyright (c) 2013 Paolo Tranquilli
*
* This extension is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* This extension is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this extension; if not, write to the Free Software
* Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
*/

const CLOSE_BUTTON = 'close-button';
const REARRANGE_DELAY = 'rearrange-delay';


const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const Workspace = imports.ui.workspace
const WindowPreview = imports.ui.windowPreview.WindowPreview
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.lib;

const Init = new Lang.Class({
	Name: 'MiddleClick.Init',

	_init: function () {
	    this._oldActivate = WindowPreview.prototype._activate;
		this._oldAddWindowClone = Workspace.Workspace.prototype._addWindowClone;
		this._settings = Lib.getSettings(Me);
		this._oldDelay = Workspace.WINDOW_REPOSITIONING_DELAY;
		this._setCloseButton();
		this._setRearrangeDelay();
	},

  _connectSettings: function() {
        this._settingsSignals = [];
        this._settingsSignals.push(this._settings.connect('changed::'+CLOSE_BUTTON, Lang.bind(this, this._setCloseButton)));
        this._settingsSignals.push(this._settings.connect('changed::'+REARRANGE_DELAY, Lang.bind(this, this._setRearrangeDelay)));
	},

  _disconnectSettings: function() {
        while(this._settingsSignals.length > 0) {
			this._settings.disconnect(this._settingsSignals.pop());
        }
    },

  _setCloseButton: function() {
		this._closeButton = this._settings.get_enum(CLOSE_BUTTON) + 1;
	},

	_setRearrangeDelay: function() {
		this._rearrangeDelay = this._settings.get_int(REARRANGE_DELAY);
	},

	enable: function() {
		// I'll go with a closure, not sure how to do it otherwise
		let init = this;

		// my handling logic
		const onClicked = function(action, actor) {
			this._selected = true;
			if (action.get_button() == init._closeButton) {
				this.metaWindow.delete(global.get_current_time());
			} else {
				init._activate.apply(this);
			}
		};

		// override _addWindowClone to add my event handler
		Workspace.Workspace.prototype._addWindowClone = function(metaWindow) {
			let clone = init._oldAddWindowClone.apply(this, [metaWindow]);
			clone.get_actions()[0].disconnect('any_signal::clicked');
			clone.get_actions()[0].connect('clicked', onClicked.bind(clone));
			return clone;
		}

		// override WindowClone's _activate
	    WindowPreview.prototype._activate = () => {};

		// override Workspace's 750ms hardcoded WINDOW_REPOSITIONING_DELAY
		Workspace.WINDOW_REPOSITIONING_DELAY = Math.max(init._rearrangeDelay,1);

		this._connectSettings();
	},

	disable: function() {
		Workspace.WINDOW_REPOSITIONING_DELAY = this._oldDelay;
		Workspace.Workspace.prototype._addWindowClone = this._oldAddWindowClone;
		this._disconnectSettings();
	}
});

function init() {
    Lib.initTranslations(Me);
	return new Init();
}
