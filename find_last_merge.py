#!/usr/bin/env python3
"""
Script to find the last merge commit on the main branch.

This script analyzes the git repository to find merge commits.
Since this repository doesn't have a traditional 'main' branch,
it searches across all available branches.
"""

import subprocess
import sys
from datetime import datetime

def run_git_command(cmd):
    """Run a git command and return the output."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return None

def find_merge_commits():
    """Find all merge commits in the repository."""
    # Try to find merge commits across all branches
    merge_commits = run_git_command("git log --merges --oneline --all")
    
    if not merge_commits:
        # If no merge commits found with --merges flag, search by commit message
        merge_commits = run_git_command("git log --grep='Merge' --oneline --all")
    
    return merge_commits

def get_commit_details(commit_hash):
    """Get detailed information about a specific commit."""
    details = {}
    
    # Get commit message
    details['message'] = run_git_command(f"git log -1 --pretty=format:'%s' {commit_hash}")
    
    # Get commit date
    details['date'] = run_git_command(f"git log -1 --pretty=format:'%ci' {commit_hash}")
    
    # Get author
    details['author'] = run_git_command(f"git log -1 --pretty=format:'%an <%ae>' {commit_hash}")
    
    # Check if it's actually a merge commit (has multiple parents)
    parents = run_git_command(f"git rev-list --parents -n 1 {commit_hash}")
    parent_count = len(parents.split()) - 1 if parents else 0
    details['is_merge'] = parent_count > 1
    
    return details

def main():
    """Main function to find and display the last merge commit."""
    print("="*80)
    print("FINDING LAST MERGE COMMIT ON MAIN BRANCH")
    print("="*80)
    
    # Check current repository status
    current_branch = run_git_command("git branch --show-current")
    all_branches = run_git_command("git branch -a")
    
    print(f"Current branch: {current_branch}")
    print(f"Available branches:")
    if all_branches:
        for branch in all_branches.split('\n'):
            print(f"  {branch}")
    print()
    
    # Check if main/master branch exists
    main_branch_exists = run_git_command("git rev-parse --verify main 2>/dev/null")
    master_branch_exists = run_git_command("git rev-parse --verify master 2>/dev/null")
    
    if not main_branch_exists and not master_branch_exists:
        print("⚠️  No 'main' or 'master' branch found in this repository.")
        print("   Searching for merge commits across all branches...")
        print()
    
    # Find merge commits
    merge_commits = find_merge_commits()
    
    if not merge_commits:
        print("❌ No merge commits found in this repository.")
        return
    
    print("📋 Found merge commits:")
    print("-" * 50)
    
    commits = merge_commits.split('\n')
    latest_merge = None
    
    for commit_line in commits:
        if commit_line.strip():
            commit_hash = commit_line.split()[0]
            details = get_commit_details(commit_hash)
            
            print(f"Commit: {commit_hash}")
            print(f"Date: {details['date']}")
            print(f"Author: {details['author']}")
            print(f"Message: {details['message']}")
            print(f"Is actual merge: {details['is_merge']}")
            print()
            
            if latest_merge is None:
                latest_merge = (commit_hash, details)
    
    if latest_merge:
        commit_hash, details = latest_merge
        print("="*80)
        print("🎯 LAST MERGE COMMIT FOUND:")
        print("="*80)
        print(f"Commit Hash: {commit_hash}")
        print(f"Date: {details['date']}")
        print(f"Author: {details['author']}")
        print(f"Message: {details['message']}")
        print(f"Is actual merge commit: {details['is_merge']}")
        
        # Show more details
        print("\n📄 Full commit details:")
        print("-" * 30)
        full_details = run_git_command(f"git show --stat {commit_hash}")
        if full_details:
            print(full_details)
    
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)

if __name__ == "__main__":
    main()