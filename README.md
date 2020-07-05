# GitHub Action for mix format --check-formatted

The default `MIX_ENV` is `"dev"`, so override it as needed.

## Usage

An example workflow to run `mix format --check-formatted` is as follows:

```hcl
workflow "Formatting" {
    on = "push"
    resolves = ["Check Changed Files Formatting"]
}

action "Check Changed Files Formatting" {
    uses = "bglusman/check-formatted@v0.1.0"
    needs = "Get Deps"
}
```