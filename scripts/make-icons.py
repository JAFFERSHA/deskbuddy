"""Renders the extension icons from the Mika character. Needs playwright + Chrome (dev only)."""
import re, subprocess, json, sys, os
from playwright.sync_api import sync_playwright
root = os.path.join(os.path.dirname(__file__), '..')
core = open(os.path.join(root, 'shared/buddy-core.js')).read()
html = '''<html><body style="margin:0;background:transparent"><div id="i" style="width:128px;height:128px;border-radius:28px;background:linear-gradient(160deg,#2f6bff,#1b2a66);overflow:hidden;position:relative"><div id="c" style="position:absolute;left:-14px;top:6px;width:156px"></div></div>
<script>%s</script><script>DeskBuddy.render(document.getElementById('c'),'mika');document.querySelector('.db-shadow').remove()</script></body></html>''' % core
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    for size, out in [(128,'browser/icons/icon128.png'),(48,'browser/icons/icon48.png'),(16,'browser/icons/icon16.png'),(128,'vscode/icon.png')]:
        pg = b.new_page(viewport={'width':128,'height':128}, device_scale_factor=size/128)
        pg.set_content(html)
        pg.locator('#i').screenshot(path=os.path.join(root,out), omit_background=True)
    b.close()
