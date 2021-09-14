import { updateMetadata } from 'pwa-helpers/metadata';
import { app } from './App';
import manifest from '../../public/manifest.json';

app.version = manifest.version;
app.short_name = manifest.short_name;
updateMetadata({ title: `${app.short_name} ${app.version}` });