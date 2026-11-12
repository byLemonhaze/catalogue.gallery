/// <reference types="node" />
import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
it('renders dark before JavaScript and removes the previous colour preference control',()=>{
    const template=readFileSync('index.html','utf8');
    expect(template).toContain('data-theme="night"');
    expect(template).toContain('name="color-scheme" content="dark"');
    expect(template).not.toContain('theme-init.js');
    expect(readFileSync('src/components/Navigation.tsx','utf8')).not.toContain('ThemePicker');
    const palette=readFileSync('src/themes.css','utf8');
    expect(palette).toContain('--catalogue-paper: #131315');
    expect(palette).not.toContain('--catalogue-scheme: light');
});
