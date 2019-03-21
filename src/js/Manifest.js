//script de récupération du fichier de configuration manifest.json 
// et de la mise à jour de l'affichage de la version

//Todo: rendre l'accès à manifest plus global
import { updateMetadata } from 'pwa-helpers/metadata';

const loadManifest = async () => {
    const manifest_file = await fetch('./manifest.json')
    const manifest = await manifest_file.json()
    return manifest
}

loadManifest().then(manifest => {
    updateMetadata({title: `${manifest.short_name} ${manifest.version}`})
})