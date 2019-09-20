## Preloaded data

Supplied are snps that have been preloaded. Select a SNP in the dropdown and then click 'Use preloaded data' to enter the app using the selected SNP.

## Input Data format

There are three required files for loading data into the public facing version of MultimorbidityExplorer. All files are required to be in `.csv` format.

These files are: 

__Phewas results file__: This file contains the results of the (most likely) univariate statistical analysis correlating each phenotype code to your SNP or biomarker of interest. The columns are

- `code`: character value uniquely denoting a given phenotype
- `OR`: Odds ratio from statistical test associating the given phenotype code with the biomarker of interest.
- `p_val`: The p-value associated with same test.
- `description`: Short description in words of what the code represents (E.g. `"Heart Failure"`).
- `category`: A hierarchical category denoting some grouping structure in your phenotypes. For instance all codes related to 'infectious diseases'. These categories are used in coloring the manhattan plot.

Any other columns that are added will be included in a small table available on mouseover of codes in app. 


__ID to SNP file__: Mapping between individual's IDs and the number of copies of the minor allele they have for the SNP of interest. A row is only needed if an individual has one or more copies of the minor allele (but data provided with rows for zero copies will work as well, just be less space efficient). 

- `IID`: Unique identifying character ID for each individual in your data. 
- `snp`: Integer corresponding to the number of copies of the minor allele the individual possesses. 


__ID to phenome file__: A mapping between an individuals ID and present phenotypes. If an individual has 10 present phenotypes they will have 10 rows in this csv; 25 phenotypes: 25 rows, etc.. Columns are: 

- `IID`: Unique identifying character ID for each individual (matches same column in __ID to SNP file__.)
- `code`: Unique identifying character ID for a given phenotype. This should match the column of the same name in __Phewas results file__.

