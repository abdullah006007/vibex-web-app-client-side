import React from 'react';
import RightComponent from '../../../Component/RightSide/RightComponent';
import LeftSide from '../../../Component/LeftSide/LeftSide';
import MiddleCom from '../../../Component/Middle/MiddleCom';

const Home = () => {

    
    
    return (
        <div className='md:flex md:justify-around bg-buttonBg'>



            <section className='w-1/4 hidden md:block'>
            <LeftSide></LeftSide>
                
            </section>



            {/* middle section */}

            <section className='md:w-3/6'>
            <MiddleCom></MiddleCom>

            </section>



            <section className='w-1/5  hidden md:block'>
            <RightComponent></RightComponent>

            </section>
            
        </div>
    );
};

export default Home;