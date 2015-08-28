module.exports = weightedRandomIndex;

function weightedRandomIndex(list, weight) {
    var total_weight = weight.reduce(function (prev, cur, i, arr) {
        return prev + cur;
    });

    var random_num = rng(0, total_weight);
    var weight_sum = 0;
    //console.log(random_num)

    for (var i = 0; i < list.length; i++) {
        weight_sum += weight[i];
        weight_sum = Math.floor(weight_sum * 100) / 100;

        if (random_num <= weight_sum || i === (list.length -1)) {
            return list[i];
        }
    }
}

function rng(min, max) {
    return Math.random() * (max - min) + min;
}