// Helper functions for pattern network code

// Take the union between two arrays
function union(arr_a, arr_b){
  return arr_a.reduce(
    (common, curr_a) => {
      const common_val = arr_b.includes(curr_a);
      if(common_val) common.push(curr_a);
      return common;
  },
  [] );
}


