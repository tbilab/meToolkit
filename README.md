# Multimorbidity Explorer App Toolkit (meToolkit)

## Intro: 

A package to build Phewas Multimorbidity Explorer (ME) apps. 

The main function in this package `meToolkit::build_me_w_loader()` spins up a fully contained and self-hosted copy of an ME app for data privacy. 

In addition to, multiple functions are provided allowing the user to customize their app from pre-loading data to configuring the individual charts included. 

## How to use: 

For general information on controlling the app see the user's manual at prod.tbilab.org/meToolkit/getting_started.

Alternatively run the command `vignette('metoolkit', 'meToolkit')` in your r console after installing the package. 

## Installing:

Currently this package is not on CRAN. To install use the `devtools` package: 

```r
devtools::install_github('tbilab/meToolkit')
```
