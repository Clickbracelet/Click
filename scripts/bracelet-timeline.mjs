const bundleTemplate = /(<script type="__bundler\/template">\s*)([\s\S]*?)(\s*<\/script>)/;

const accountPicker = `
<label style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; font-size: 14px; font-weight: 600">
<span>View demo account</span>
<sc-raw-select value="{{demoOwner}}" disabled="{{braceletBusy}}" sc-camel-on-change="{{switchDemoOwner}}" style="min-height: 40px; padding: 0 12px; border: 1px solid #E7DFD6; border-radius: 14px; background: #FFFFFF; color: #4A1A2C; font: inherit">
<option value="USER_101">USER_101</option>
<option value="USER_202">USER_202</option>
</sc-raw-select>
</label>
`.trim();

const primaryButton = 'min-height: 40px; padding: 0 16px; border: 1px solid #4A1A2C; border-radius: 999px; background: #4A1A2C; color: #FFFFFF; font: inherit; font-weight: 600; cursor: pointer';
const secondaryButton = 'min-height: 40px; padding: 0 12px; border: 1px solid #E7DFD6; border-radius: 999px; background: #FAF7F2; color: #4A1A2C; font: inherit; font-weight: 600; cursor: pointer';
const braceletPanel = `
<section aria-label="Bracelet sync" style="display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid #E7DFD6; border-radius: 18px; background: #FFFFFF; font-size: 13px">
<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
<sc-if value="{{braceletDisconnected}}" hint-placeholder-val="{{true}}">
<button type="button" disabled="{{braceletBusy}}" sc-camel-on-click="{{connectBracelet}}" style="${primaryButton}">Sync bracelet</button>
<span style="color: #7A5E66">Bracelet disconnected</span>
</sc-if>
<sc-if value="{{braceletConnected}}" hint-placeholder-val="{{false}}">
<span style="flex-basis: 100%; overflow-wrap: anywhere">{{braceletName}}</span>
<button type="button" disabled="{{braceletBusy}}" sc-camel-on-click="{{syncBracelet}}" style="${primaryButton}">Sync now</button>
<button type="button" disabled="{{braceletBusy}}" sc-camel-on-click="{{disconnectBracelet}}" style="${secondaryButton}">Disconnect</button>
<button type="button" disabled="{{braceletBusy}}" sc-camel-on-click="{{switchBracelet}}" style="${secondaryButton}">Switch bracelet</button>
</sc-if>
</div>
<p role="status" style="margin: 0; color: #7A5E66">{{braceletMessage}}</p>
</section>
`.trim();

function replaceOnce(template, before, after) {
  const start = template.indexOf(before);
  if (start === -1 || template.indexOf(before, start + before.length) !== -1) {
    throw new Error('Frontend.html changed. Check the timeline preview anchor: ' + before.slice(0, 90));
  }
  return template.slice(0, start) + after + template.slice(start + before.length);
}

// Render an in-memory variant of the exported prototype. Its original HTML,
// mobile bundle, and sample data stay available through their usual entrypoints.
export function renderPreview(html, accounts) {
  const match = html.match(bundleTemplate);
  if (!match) throw new Error('Frontend.html is missing its bundled template.');
  let template = JSON.parse(match[2]);
  const replace = (before, after) => {
    template = replaceOnce(template, before, after);
  };

  replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">');
  replace('width: 390px; height: 844px; box-sizing: border-box; background: #FAF7F2;',
    'width: min(100%, 390px); height: min(100dvh, 844px); margin-inline: auto; box-sizing: border-box; background: #F5F0E8;');
  replace('#C9A14A"></span>Synced</span>', '#C9A14A"></span>Local preview</span>');
  replace('<p style="margin: 0; font-size: 14px; color: #7A5E66">{{countText}}</p>',
    '<p role="status" style="margin: 0; font-size: 14px; color: #7A5E66">{{countText}}</p>');
  const filtersRow = '<div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin: 0 -20px; padding-left: 20px; padding-right: 20px">\n<sc-for list="{{filters}}" as="f" hint-placeholder-count="7">';
  replace(filtersRow, [accountPicker, braceletPanel, filtersRow].join('\n'));
  replace('No one in this time range. Try a longer one.',
    'No encounters in this view. Try All time or switch demo accounts.');

  replace('class Component extends DCLogic {', `
const BRACELET_ENCOUNTERS = ${JSON.stringify(accounts)};
const tapTime = new Intl.DateTimeFormat(undefined, {
  year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric',
  minute: '2-digit', second: '2-digit', timeZoneName: 'short'
});
function demoClicks(accounts, owner) {
  const now = Date.now();
  return accounts[owner].slice()
    .sort((a, b) => (b.timestampMs ?? 0) - (a.timestampMs ?? 0))
    .map(({ id, peerId, timestampMs }) => ({
      id, name: peerId, desc: 'Bracelet encounter', loc: '', event: '',
      photo: '', socials: [], about: '', mins: timestampMs === null
        ? Infinity : Math.max(0, (now - timestampMs) / 60000),
      when: timestampMs === null ? 'Time unknown' : tapTime.format(timestampMs)
    }));
}

class Component extends DCLogic {`.trimStart());
  replace("      screen: 'welcome',", `      screen: 'clicks',
      demoOwner: 'USER_101',
      demoEncounters: BRACELET_ENCOUNTERS,
      braceletInfo: null,
      braceletBusy: false,
      braceletMessage: '',`);
  replace("      filter: 'year',", "      filter: 'all',");
  replace('  componentWillUnmount() { clearTimeout(this.pairTimer); clearTimeout(this.askTimer); }', `  componentDidMount() {
    this.braceletControls = window.createClickBraceletControls({
      update: (patch) => this.setState(patch),
      updateTimeline: (demoEncounters) => this.setState({ demoEncounters, filter: 'all' }),
      selectDemoOwner: (owner) => this.selectDemoOwner(owner)
    });
  }

  componentWillUnmount() {
    clearTimeout(this.pairTimer);
    clearTimeout(this.askTimer);
    this.braceletControls?.close();
  }

  selectDemoOwner(demoOwner) {
    if (!Object.hasOwn(BRACELET_ENCOUNTERS, demoOwner)) return false;
    clearTimeout(this.askTimer);
    this.setState({
      demoOwner, filter: 'all', selectedId: null, expandedId: null,
      noteOpenId: null, editingLoc: false, locDraft: '',
      chat: [], chatDraft: '', asking: false
    });
    return true;
  }`);
  replace('const people = CLICK_DATA.filter', 'const people = demoClicks(this.state.demoEncounters, this.state.demoOwner).filter');
  replace('const CLICKS = CLICK_DATA;', 'const CLICKS = demoClicks(s.demoEncounters, s.demoOwner);');
  replace('const FILTERS = [', "const FILTERS = [\n      { id: 'all', label: 'All time', max: Infinity, phrase: 'saved locally' },");
  replace('|| FILTERS[6];', '|| FILTERS[0];');
  replace("place: ev ? ev + ', ' + c.loc : c.loc,", "place: [ev, c.loc].filter(Boolean).join(', ') || 'Location not recorded',");
  replace("screen: 'clicks', filter: 'year', expandedId: p.id", "screen: 'clicks', filter: 'all', expandedId: p.id");
  replace('|| CLICKS[0];', "|| CLICKS[0] || { name: '', desc: '', loc: '', when: 'Time unknown', socials: [] };");
  replace('      filters, clicks,', `      demoOwner: s.demoOwner,
      braceletBusy: s.braceletBusy,
      braceletMessage: s.braceletMessage,
      braceletConnected: !!s.braceletInfo,
      braceletDisconnected: !s.braceletInfo,
      braceletName: s.braceletInfo ? 'Connected to ' + s.braceletInfo.userId + ' · Click-' + s.braceletInfo.deviceId : '',
      connectBracelet: () => this.braceletControls.choose(s.demoOwner),
      switchBracelet: () => this.braceletControls.choose(s.demoOwner, true),
      syncBracelet: () => this.braceletControls.sync(s.demoOwner),
      disconnectBracelet: () => this.braceletControls.disconnect(),
      switchDemoOwner: (e) => {
        const demoOwner = e.target.value;
        if (s.braceletBusy || demoOwner === s.demoOwner || !Object.hasOwn(BRACELET_ENCOUNTERS, demoOwner)) return;
        this.braceletControls.disconnect();
        this.selectDemoOwner(demoOwner);
      },
      filters, clicks,`);
  replace("braceletStatus: s.locked ? 'Locked · Not sharing' : 'Connected via Bluetooth',",
    "braceletStatus: s.braceletInfo ? 'Connected to ' + s.braceletInfo.userId : 'Bracelet disconnected',");
  replace("repair: set({ screen: 'pair', fromSettings: true, pairState: 'idle' }),",
    "repair: set({ screen: 'clicks' }),");
  const signOut = "signOut: set({ screen: 'welcome', fromSettings: false, pairState: 'idle', filter: 'year', removed: {}, events: {}, notes: {}, expandedId: null, chat: [], chatDraft: '' }),";
  replace(signOut, `signOut: () => {
        if (this.state.braceletBusy) return;
        this.braceletControls.disconnect();
        ${signOut.slice('signOut: '.length, -1)}();
      },`);

  const packed = JSON.stringify(template).replace(/<\//g, '<\\u002F');
  const preview = html.replace(bundleTemplate, (_, open, _old, close) => open + packed + close);
  return replaceOnce(preview, '    const manifest = JSON.parse(manifestEl.textContent);',
    "    await import('/bracelet-controls.mjs');\n    const manifest = JSON.parse(manifestEl.textContent);");
}
