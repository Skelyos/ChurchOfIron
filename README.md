# ChurchOfIron

This project uses Angular 22 and [Angular CLI](https://angular.dev/tools/cli).

Use Node.js 22.22.3+, 24.15.0+, or 26.0.0+ (within the matching supported major release) with npm 10 or later.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` to create a production build in the `dist/` directory.

## Running unit tests

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Linting

Run `npm run lint` to lint TypeScript and Angular templates with ESLint.

## Planner data and events

The planner fetches WuWa characters and material names from [Encore.moe](https://encore.moe/), ZZZ data from [Nanoka](https://zzz.nanoka.cc/), and Endfield data from [Endfield Assets](https://endfield-assets.fffdan.com/scalar/). No account connection is needed. Selecting a character loads its progression costs. WuWa and ZZZ totals cover character EXP, promotion, skills and relevant core/stat nodes. Endfield totals cover character EXP and promotion; skills and other ability matrix nodes are not included. Weapons are not included. Legacy placeholder goals and inventory remain visible as unresolved; export a backup before removing them.

ZZZ uses the pinned Nanoka `3.4.4+20539349` dataset, which is **beta** relative to the released game version when selected. All ZZZ characters, progression and totals from this dataset are marked beta, including previously released characters: beta data can change and the source does not establish an individual character's release status. The pinned version must be reviewed and updated in `src/app/planner/services/catalog-service.ts` when it is superseded; it does not automatically track future releases. WuWa and Endfield use live data, which may change without notice. Endfield's source revision is displayed but is not a game release number; it may include unavailable characters, and release status is unverified. These integrations need a network connection. A failed fetch is shown and can be retried; previously loaded data remains in memory and is marked potentially stale, while unresolved goals are excluded from totals. There is no persistent offline catalog cache.

Manual events can be created, edited, and deleted in the planner, with countdowns based on their saved dates. Times are entered, displayed, and saved in UTC. Existing events keep their saved instants and are displayed in UTC. Events, goals, and inventory are stored in the browser and included in planner exports. There is no shared event service or automatic event feed yet; no documented public Seelie activity feed was found, and Seelie personal planner data is not imported. See [Seelie's privacy policy](https://zzz.seelie.me/policy).

Use **Add character** to select a character and set its current and target progression before saving a goal. Existing builds can be edited from their goal cards. Material cards show icons when available, total requirements and the characters that need each material; character amounts are before subtracting shared inventory. **Manage events** opens an event editor with a game selector; saved events appear on the planner with edit and delete controls. Both dialogs close after a successful save unless **Keep open** is checked. The planner game filter controls which events, goals, stamina, and material totals are shown and selects the initial game in the event editor. Unsaved event drafts are retained when switching games within the dialog, but discarded when it is closed.

Character and skill levels start at 1; promotion, core and stat-node tracks use completed-upgrade positions starting at 0. Existing saved goals retain their stored positions and material costs.

ZZZ level EXP comes from Nanoka; WuWa level EXP uses the [RoleLevelConsume game-data table](https://github.com/Dimbreath/WutheringData/blob/master/ConfigDB/RoleLevelConsume.json), with 0.35 Shell Credits per EXP; Endfield level EXP and T-Creds come from Endfield Assets. The planner assumes zero partial EXP at the current level. EXP item cards show a suggested mix: existing items are allocated highest-tier first, then any shortfall is filled from the highest tier downward, rounding up the smallest tier. Endfield Combat Records cover levels 1–60; Cognitive Carriers cover 60–90 and cannot substitute for them. The plan rounds per character, but does not account for EXP lost at intermediate promotion caps; actual item and currency costs may be higher. Existing goals omit level costs until edited.

Use the settings button on the Stamina card to set each game's account level and maximum stamina. The ready estimate shows when stamina will reach that maximum. Empty maximum fields use the game default; Endfield's default follows its [Authority Level table](https://endfield.wiki.gg/wiki/Authority_Level), and Sanity regenerates once every 7 minutes and 12 seconds. A manual maximum overrides the calculated cap until cleared. Account levels and maximums are saved locally and included in planner exports.

Planner display components live in individual folders under `src/app/planner/components`; the character and event dialogs live under `src/app/planner/modals` and receive their opening data through Angular Material.

Source research on 19 November 2026:

- [Encore.moe API](https://api-v2.encore.moe/_docs/scalar) returns a WuWa character list including Lily from version 3.8, and character details include promotion and skill-tree data. The Yangyang first promotion and full skill/ascension currency total were checked against [an independent guide](https://gachaflex.com/wuwa/blog/yangyang-ascension-materials); not all characters or tracks have been independently verified. Its [terms](https://encore.moe/terms) state that data and availability can change without notice.
- [zzz-api](https://github.com/Syqhu/zzz-api) describes a version 3.0 character catalog, behind the then-current 3.3 release, and is not used. Nanoka's 3.4.4 dataset is used as beta: 3.4 was not yet released according to the [official special-program announcement](https://zenless.hoyoverse.com/en-us/news/167352?af_id=hub). Anby's first promotion and skill costs were checked against [an independent guide](https://www.oneesports.gg/zenless-zone-zero/all-anby-materials-promotion/), but not all characters or tracks have been independently verified.
- Endfield Assets provides English localization and character growth and item tables. All four promotion costs for Perlica and Si were checked against [Endfield Talos Wiki](https://endfield.wiki.gg/wiki/Operator/List); other characters have not been independently verified. The source's rights, update cadence and revision semantics remain unverified. The wiki is not used as a runtime dependency.

The application requests third-party game data directly from the user's browser; the services can see the requester's IP address. Data belongs to the respective game owners and is provided by independent community sources. No API credentials are used; the WuWa level EXP table and EXP item conversion rates are bundled. Source availability, terms and freshness should be rechecked when updating an integration.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
