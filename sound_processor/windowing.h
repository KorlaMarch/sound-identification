#ifndef WINDOWING_H

#define WINDOWING_H

#include "math.h"
#include "constant.h"

//Rectangular window
void rectangularWindowing(short* input, short* output, int N);
//Triangular window
void triangularWindowing(short* input, short* output, int N);
//Hanning window
void hanningWindowing(short* input, short* output, int N);
//Hamming window
void hammingWindowing(short* input, short* output, int N);
//Blackman–Harris window
void blackmanHarrisWindowing(short* input, short* output, int N);
//Flat top window
void flatTopWindowing(short* input, short* output, int N);
//Windows selector
void doWindowing(short* input, short* output, int N, char windowType);

#endif