#!/bin/bash
sed -i '' -e 's/  display: flex;/  display: block;/g' styles.css
sed -i '' -e '/  align-items: flex-end;/d' styles.css
sed -i '' -e '/  gap: 4px;/d' styles.css
sed -i '' -e '/  min-width: max-content;/d' styles.css
