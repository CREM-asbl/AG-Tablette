import manifest from '../../../public/manifest.json';
import { app } from './App';

app.version = manifest.version;
app.short_name = manifest.short_name;
document.title = `${app.short_name} ${app.version}`