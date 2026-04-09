add_icon() {
  curl -sSL "https://github.com/google/material-design-icons/raw/refs/heads/master/symbols/web/${1}/materialsymbolsoutlined/${1}_24px.svg" \
    -o "src/assets/symbols/${1}.svg" \
    -w "%{http_code}"

  echo "export { default as icon_${1} } from './${1}.svg?raw';" \
    >> "src/assets/symbols/index.ts"
}

rm "src/assets/symbols/index.ts"
add_icon add
add_icon edit
add_icon save
add_icon delete
add_icon close
add_icon chevron_left
add_icon visibility
add_icon visibility_off
