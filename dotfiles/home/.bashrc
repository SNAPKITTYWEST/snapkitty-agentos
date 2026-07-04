# dotfiles/home/.bashrc
for f in ~/.bashrc.d/*.sh; do
  [ -r "$f" ] && . "$f"
done
