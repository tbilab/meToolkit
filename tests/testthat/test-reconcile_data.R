context('Raw data is meToolkit:::reconciled and returned in app-friendly format')

genome_data <- dplyr::tribble(~ id, ~ rs1234,
                              'a',  0,
                              'b',  1,
                              'c',  2,
                              'd',  1)

phenome_data <- dplyr::tribble(~ id,
                               ~ code,
                               'a',
                               '0.03',
                               'a',
                               '1.04',
                               'b',
                               '1.04',
                               'c',
                               '2.00',
                               'c',
                               '0.03',
                               'd',
                               '2.00')

# Last we check phewas results
phewas_results <- dplyr::tribble(
  ~ code,
  ~ description,
  ~ OR,
  ~ p_val,
  ~ category,
  '0.03',
  'My code description a',
  3.12,
  0.0001,
  'neurological',
  '1.04',
  'My code description b',
  4.21,
  0.99,
  'digestive',
  '2.00',
  'My code description c',
  0.03,
  0.000002,
  'neurological'
)


# A wide dataframe with columns \code{id}, \code{snp}, and all the
#'   unique phecodes.
desired_ind_data <- dplyr::tribble(
  ~ IID,
  ~ `0.03`,
  ~ `1.04`,
  ~ `2.00`,
  ~ snp,
  'a',
  1,
  1,
  0,
  0,
  'b',
  0,
  1,
  0,
  1,
  'c',
  1,
  0,
  1,
  2,
  'd',
  0,
  0,
  1,
  1,
)

desired_results <- list(
  snp_name = 'rs1234',
  individual_data = desired_ind_data,
  phewas_results = phewas_results
)


test_that("Data is merged properly and snp returned", {
  expect_equal(
    meToolkit:::reconcile_data(
      phewas_results,
      genome_data,
      phenome_data,
      multiple_comparisons_adjustment = "none"
    ),
    desired_results
  )
})

test_that("SNP is properly picked up", {
  expect_equal(
    meToolkit:::reconcile_data(
      phewas_results,
      genome_data %>% dplyr::rename(rs4547 = rs1234),
      multiple_comparisons_adjustment = "none",
      phenome_data
    )$snp_name,
    'rs4547'
  )
})

test_that("Is robust to id column changes", {
  expect_equal(
    meToolkit:::reconcile_data(
      phewas_results,
      genome_data %>% dplyr::rename(grid = id),
      phenome_data %>% dplyr::rename(grid = id),
      multiple_comparisons_adjustment = "none"
    ),
    desired_results
  )
})

test_that("Warns and removes when there are mismatched codes in individual and phewas data",
          {
            expect_warning(
              meToolkit:::reconcile_data(
                phewas_results,
                genome_data,
                phenome_data %>% dplyr::filter(code != '0.03'),
                multiple_comparisons_adjustment = "none"
              ),
              '1 codes removed from data due to mismatch between individual data and phewas results.'
            )

            expect_equal(
              suppressWarnings({
                meToolkit:::reconcile_data(
                  phewas_results,
                  genome_data,
                  phenome_data %>% dplyr::filter(code != '0.03'),
                  multiple_comparisons_adjustment = "none"
                )
              }),
              list(
                snp_name = 'rs1234',
                individual_data = desired_ind_data %>% dplyr::select(-`0.03`),
                phewas_results = phewas_results %>% dplyr::filter(code != '0.03')
              )
            )

          })
