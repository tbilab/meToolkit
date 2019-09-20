library(dplyr)

context("SNP Data Validation")

# Start with the SNP/ Genome data checking
good_snp_data <- dplyr::tribble(
  ~id, ~rs12345,
  'r1',  0,
  'r2',  1,
  'r3',  2,
  'r4',  1,
  'r5',  0,
  'r6',  2
)

test_that("Exports snp name when desired", {
  results <- meToolkit::checkGenomeFile(good_snp_data, separate = TRUE)
  expect_equal(results$snp_name, 'rs12345')
  expect_equal(colnames(results$data), c('id', 'snp'))
})

test_that("Leaves data intact when desired", {
  expect_equal(
    meToolkit::checkGenomeFile(good_snp_data, separate = FALSE),
    good_snp_data)
})

test_that("No ID column fails", {

  expect_error(
    good_snp_data %>%
      dplyr::rename(some_random_name = id) %>%
      meToolkit::checkGenomeFile(),
    "Missing id column. Make sure your data has a column with one of the following names: iid, id, grid"
  )

})

test_that("Grid id column works and get converted", {

  expect_equal(
    good_snp_data %>%
      dplyr::rename(grid = id) %>%
      meToolkit::checkGenomeFile(separate = FALSE),
    good_snp_data
  )

})

test_that("IID id column works and get converted", {

  expect_equal(
    good_snp_data %>%
      dplyr::rename(IID = id) %>%
      meToolkit::checkGenomeFile(separate = FALSE),
    good_snp_data
  )

})


test_that("SNP counts too high fails", {

  expect_error(
    good_snp_data %>%
      dplyr::mutate(rs12345 = rs12345 + 1) %>%
      meToolkit::checkGenomeFile(too_high_count_snp_data),
    'Your SNP copies column appears to have values other than 0,1,2.')

  })

context("Phenome Data Validation")

# Next, we check phenome pairs
good_phenome_data <- dplyr::tribble(
  ~id,   ~code,
  'r1',   '0.03',
  'r2',   '1.04',
  'r3',   '2.08',
  'r4',   '1.01',
  'r5',   '0.04',
  'r6',   '2.02'
)

test_that("Good data flows through unchanged", {
  expect_equal(
    meToolkit::checkPhenomeFile(good_phenome_data),
    good_phenome_data
  )
})

test_that("Grid id column works and get converted", {
  expect_equal(
    good_phenome_data %>%
      dplyr::rename(grid = id) %>%
      meToolkit::checkPhenomeFile(),
    good_phenome_data
  )
})

test_that("IID id column works and get converted", {
  expect_equal(
    good_phenome_data %>%
      dplyr::rename(IID = id) %>%
      meToolkit::checkPhenomeFile(),
    good_phenome_data
  )
})

test_that('Missing ID gets error', {
  expect_error(
    good_phenome_data %>%
      dplyr::rename(my_super_id = id) %>%
      meToolkit::checkPhenomeFile(),
    "Missing id column. Make sure your data has a column with one of the following names: iid, id, grid"
  )
})

test_that('Missing code gets error', {
  expect_error(
    good_phenome_data %>%
      dplyr::rename(my_super_code = code) %>%
      meToolkit::checkPhenomeFile(),
    "Missing Code column."
  )
})


context("Phewas Results Validation")


# Last we check phewas results
good_phewas_results <- dplyr::tribble(
  ~code,    ~description,            ~OR,    ~p_val,   ~category,
  '0.03',   'My code description a', 3.12,   0.0001,   'neurological',
  '1.04',   'My code description b', 4.21,   0.99,     'digestive',
  '2.08',   'My code description c', 0.03,   0.000002, 'neurological',
  '1.01',   'My code description d', 124.2,  0.02,     'circulatory',
  '0.04',   'My code description e', 3.92,   0.042,    'neurological',
  '2.02',   'My code description f', 12.34,  0.022,    'infectious disease'
)

test_that("Good data flows through unchanged", {
  results <- meToolkit::checkPhewasFile(good_phewas_results)
  expect_equal(results, good_phewas_results)
})

test_that('Missing the code throws error', {
  expect_error(
    good_phewas_results %>%
      dplyr::select(-code) %>%
      meToolkit::checkPhewasFile(),
    'Missing code column.'
  )
})

test_that('Missing multiple columns throws error with column names missing', {
  expect_error(
   good_phewas_results %>%
      dplyr::rename(my_codes = code, my_or = OR, descrip = description) %>%
      meToolkit::checkPhewasFile(),
    'Missing columns code, OR, and description.'
  )
})
