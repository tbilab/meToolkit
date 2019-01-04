# Multimorbidity Explorer App Toolkit (meToolkit)

## Intro: 

This package provides a series of widgets to wire together to create Shiny apps for explore multimorbidity patterns. 

## Basic Setup: 

A multimorbidity explorer app contains three sources of data. 

### Individual-level data: 
A dataframe the following columns: 

- `IID`: a unique string id.
- `snp`: number of copies of the current snp's minor allele.
- Phecodes...: a series of columns corresponding to the phecodes of interest and if the occurred (`1`) or if they didn't (`0`). 

### Phewas Results: 
A dataframe containing the results of the to-be-investigated phewas study. Contains at least the following columns:

- `code`: A phecode ID (matching the individual data's column titles).
- `category`: String of the phecode's broad descriptive category. E.g. "infectious diseases".
- `p_val`: The P-Value for the current phecode's association with the study's SNP.
- `tooltip`: Html formatted text shown on hover over a phecode in manhattan or network plot. 
- `color`: CSS compliant color string for encoding each phecode in plots. 

### SNP Name: 
A simple string containing the name of the SNP investigated in study.
