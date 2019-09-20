context('Merge phenome and genome data to wide format')

genome_data <- dplyr::tribble(
  ~id, ~snp,
  'a',  0,
  'b',  1,
  'c',  2,
  'd',  1
)

phenome_data <- dplyr::tribble(
  ~id,   ~code,
  'a',   '0.03',
  'a',   '1.04',
  'b',   '1.04',
  'c',   '2.00',
  'c',   '0.03',
  'd',   '2.00'
)

# A wide dataframe with columns \code{id}, \code{snp}, and all the
#'   unique phecodes.
desired_results <- dplyr::tribble(
  ~id, ~`0.03`, ~`1.04`, ~`2.00`, ~snp,
  'a',       1,       1,       0,    0,
  'b',       0,       1,       0,    1,
  'c',       1,       0,       1,    2,
  'd',       0,       0,       1,    1,
)


test_that("Joining simple data", {
  expect_equal(
    meToolkit::mergePhenomeGenome(phenome_data, genome_data),
    desired_results
  )
})
