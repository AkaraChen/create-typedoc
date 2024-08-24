import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { confirm } from '@inquirer/prompts';
import consola from 'consola';
import { ensureDependencyInstalled } from 'nypm';
import { packageUp } from 'package-up';
import { updatePackage } from 'write-package';

consola.info('Setting up dependencies...');
await ensureDependencyInstalled('typedoc', { dev: true });
await ensureDependencyInstalled('typedoc-material-theme', { dev: true });

let entry;
for (const tryEntry of ['index.ts', 'src/index.ts']) {
    if (fs.existsSync(tryEntry)) {
        consola.info('Found entry file:', tryEntry);
        entry = tryEntry;
        break;
    }
}
if (!entry) {
    consola.error(new Error('No entry file found'));
    process.exit(1);
}

await updatePackage(
    // @ts-expect-error just throw
    await packageUp(),
    {
        scripts: {
            doc: `typedoc ${entry} --plugin typedoc-material-theme  --themeColor '#1C6EF3'`,
        },
    },
);
consola.success('Updated package.json');

if (
    await confirm({
        message: 'Do you want to deploy the docs on vercel?',
    })
) {
    await fsp.writeFile(
        'vercel.json',
        await fsp.readFile(new URL('./vercel.json', import.meta.url)),
    );
    consola.info('Created vercel.json');
}

consola.info('Adding .gitignore entry...');
fsp.appendFile(
    '.gitignore',
    '\n# typedoc\n/docs\n',
    { flag: 'a' },
)

consola.success('Setup complete');