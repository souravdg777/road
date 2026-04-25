#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage:"
  echo "  branch.sh create <type> <name>   # type = feature | fix"
  echo "  branch.sh merge <branch-name>"
  echo "  branch.sh delete <branch-name>"
  exit 1
}

[[ $# -lt 2 ]] && usage

CMD=$1

case "$CMD" in
  create)
    [[ $# -lt 3 ]] && usage
    TYPE=$2
    NAME=$3
    if [[ "$TYPE" != "feature" && "$TYPE" != "fix" ]]; then
      echo "Error: type must be 'feature' or 'fix'" >&2
      exit 1
    fi
    BRANCH="${TYPE}/${NAME}"
    echo "Switching to main and pulling latest..."
    git checkout main
    git pull origin main
    echo "Creating branch: $BRANCH"
    git checkout -b "$BRANCH"
    echo "Done. You are now on $BRANCH"
    ;;

  merge)
    BRANCH=$2
    echo "Switching to main and pulling latest..."
    git checkout main
    git pull origin main
    echo "Merging $BRANCH into main..."
    git merge --no-ff "$BRANCH" -m "Merge branch '$BRANCH'"
    echo "Pushing main to origin..."
    git push origin main
    echo "Done. $BRANCH merged into main."
    ;;

  delete)
    BRANCH=$2
    git branch -d "$BRANCH"
    echo "Deleted local branch: $BRANCH"
    ;;

  *)
    usage
    ;;
esac
