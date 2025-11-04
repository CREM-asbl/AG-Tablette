import { app } from './App';

const file = await fetch('/manifest.json');
const manifest = await file.json();
app.version = manifest.version;
app.short_name = manifest.short_name;
document.title = `${app.short_name} ${app.version}`;
