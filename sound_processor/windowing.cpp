#include "windowing.h"

//Rectangular window
void rectangularWindowing(short* input, short* output, int N){
	for(int i = 0; i < N; i++){
		output[i] = input[i];
	}
}

//Triangular window
void triangularWindowing(short* input, short* output, int N){
	const double L = (N-1)/2;
	for(int i = 0; i < N; i++){
		output[i] = input[i]*(1.0-fabs((i-L)/L));
	}
}

//Hanning window
void hanningWindowing(short* input, short* output, int N){
    for(int i = 0; i < N; i++){
        output[i] = input[i]*0.5*(1-cos(2.0*M_PI*i/(N-1)));
    }
}

//Hamming window
void hammingWindowing(short* input, short* output, int N){
	const double al = 0.53836;
	for(int i = 0; i < N; i++){
		output[i] = input[i]*(al-(1.0-al)*cos(2.0*M_PI*i/(N-1)) );
	}
}

//Blackman–Harris window
void blackmanHarrisWindowing(short* input, short* output, int N){
	const double a0 = 0.35875, a1 = 0.48829, a2 = 0.14128, a3 = 0.01168;
	for(int i = 0; i < N; i++){
		output[i] = input[i]*(a0 - a1*cos(2.0*M_PI*i/(N-1)) + a2*cos(4.0*M_PI*i/(N-1)) - a3*cos(6.0*M_PI*i/(N-1)) );
	}
}

//Flat top window
void flatTopWindowing(short* input, short* output, int N){
	const double a0 = 1, a1 = 1.93, a2 = 1.29, a3 = 0.388, a4 = 0.028;
	for(int i = 0; i < N; i++){
		output[i] = input[i]*(a0 - a1*cos(2.0*M_PI*i/(N-1)) + a2*cos(4.0*M_PI*i/(N-1)) - a3*cos(6.0*M_PI*i/(N-1)) + a4*cos(8.0*M_PI*i/(N-1)) );
	}
}

void doWindowing(short* input, short* output, int N, char windowType){
	switch(windowType){
		case '\0':
		case 'R':
		case 'r':
			rectangularWindowing(input,output,N);
			break;
		case 'T':
		case 't':
			triangularWindowing(input,output,N);
			break;
		case 'H':
		case 'h':
			hanningWindowing(input,output,N);
			break;
		case 'M':
		case 'm':
			hammingWindowing(input,output,N);
			break;
		case 'B':
		case 'b':
			blackmanHarrisWindowing(input,output,N);
			break;
		case 'F':
		case 'f':
			flatTopWindowing(input,output,N);
			break;
	}
}