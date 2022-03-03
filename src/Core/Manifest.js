import { updateMetadata } from 'pwa-helpers/metadata';
import manifest from '../../public/manifest.json';
import { app } from './App';

app.version = manifest.version;
app.short_name = manifest.short_name;
updateMetadata({ title: `${app.short_name} ${app.version}` });
